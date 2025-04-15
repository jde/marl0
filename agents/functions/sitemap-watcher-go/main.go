// sitemap-watcher.go (all-in-one Go version)
package main

import (
	"bufio"
	"context"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/antchfx/xmlquery"
	_ "modernc.org/sqlite"
)

var (
	metricUrlsFound = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "sitemap_urls_found",
		Help: "Total URLs found in sitemap",
	})
	metricUrlsPushed = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "sitemap_url_pushed",
		Help: "Total URLs pushed to queue",
	})
	metricErrors = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "sitemap_errors",
		Help: "Errors encountered during processing",
	})
)

func init() {
	prometheus.MustRegister(metricUrlsFound, metricUrlsPushed, metricErrors)
}

func // only call this once
	startMetricsServer() {
	http.Handle("/metrics", promhttp.Handler())
	go http.ListenAndServe(":9100", nil)
	log.Println("Prometheus metrics on :9100/metrics")
}

func loadSitemaps(path string) ([]map[string]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	reader := csv.NewReader(bufio.NewReader(file))
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}
	var out []map[string]string
	headers := records[0]
	for _, row := range records[1:] {
		rowMap := make(map[string]string)
		for i, cell := range row {
			rowMap[headers[i]] = cell
		}
		out = append(out, rowMap)
	}
	return out, nil
}

func seenInit() *sql.DB {
	db, err := sql.Open("sqlite", "seen-urls.db")
	if err != nil {
		log.Fatal(err)
	}
	db.Exec(`CREATE TABLE IF NOT EXISTS seen_urls (url TEXT PRIMARY KEY, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`)
	return db
}

func seenCheck(db *sql.DB, url string) bool {
	var exists string
	err := db.QueryRow("SELECT url FROM seen_urls WHERE url = ?", url).Scan(&exists)
	return err == nil
}

func seenMark(db *sql.DB, url string) {
	db.Exec("INSERT OR IGNORE INTO seen_urls (url) VALUES (?)", url)
}

func parseSitemap(url string) ([]map[string]string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if !strings.Contains(resp.Header.Get("Content-Type"), "xml") {
		log.Printf("Skipping non-XML content at %s", url)
		return nil, nil
	}
	doc, err := xmlquery.Parse(resp.Body)
	if err != nil {
		return nil, err
	}
	var out []map[string]string
	for _, node := range xmlquery.Find(doc, "//url") {
		entry := map[string]string{}
		for child := node.FirstChild; child != nil; child = child.NextSibling {
			if child.Type == xmlquery.ElementNode {
				entry[child.Data] = strings.TrimSpace(child.InnerText())
			}
		}
		out = append(out, entry)
	}
	return out, nil
}

func sendToKafka(writer *kafka.Writer, message any) error {
	jsonBytes, err := json.Marshal(message)
	if err != nil {
		return err
	}
	msg := kafka.Message{
		Value: jsonBytes,
	}
	return writer.WriteMessages(context.Background(), msg)
}

func main() {
	
	// prevent redeclaration
	topic := "sitemap.entries"
	log.Printf("Using Kafka topic: %s", topic)

	startMetricsServer()

	db := seenInit()
	defer db.Close()

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"kafka:9092"},
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
	})
	defer writer.Close()

	ticker := time.NewTicker(time.Hour)
	for {
		log.Println("Running sitemap crawler...")
		sitemaps, err := loadSitemaps("sitemaps.csv")
		if err != nil {
			log.Println("Error loading CSV:", err)
			metricErrors.Inc()
			continue
		}
		for _, sm := range sitemaps {
			entries, err := parseSitemap(sm["url"])
			if err != nil {
				log.Printf("Sitemap fetch error (%s): %v", sm["url"], err)
				metricErrors.Inc()
				continue
			}
			metricUrlsFound.Add(float64(len(entries)))
			for _, entry := range entries {
				if seenCheck(db, entry["loc"]) {
					continue
				}
				payload := map[string]string{
					"url": entry["loc"],
					"lastmod": entry["lastmod"],
					"title": entry["title"],
					"pubDate": entry["pubDate"],
					"source": sm["source"],
					"section": sm["section"],
				}
				log.Printf("📤 Writing to Kafka: %+v", payload)
				err = sendToKafka(writer, payload)
				if err != nil {
					log.Println("Kafka send error:", err)
					metricErrors.Inc()
					continue
				}
				seenMark(db, entry["loc"])
				metricUrlsPushed.Inc()
			}
		}
		<-ticker.C
	}
}
