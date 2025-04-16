// story-fetcher.go (restored chromedp implementation)
package main

import (
	"context"
	"encoding/json"
	"log"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/chromedp/chromedp"
	"github.com/go-shiori/go-readability"
	"github.com/segmentio/kafka-go"
)

var debugMode = strings.ToLower(os.Getenv("LOG_LEVEL")) == "debug"

func debugLog(msg string, args ...any) {
	if debugMode {
		log.Printf("[debug] "+msg, args...)
	}
}

type StoryURL struct {
	URL     string `json:"url"`
	Source  string `json:"source"`
	Section string `json:"section"`
	Title   string `json:"title"`
	PubDate string `json:"pubDate"`
	LastMod string `json:"lastmod"`
}

type CleanedStory struct {
	URL         string `json:"url"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	Excerpt     string `json:"excerpt"`
	Content     string `json:"content"`
	HasVideo    bool   `json:"has_video"`
	Source      string `json:"source"`
	Section     string `json:"section"`
	OriginalTS  string `json:"original_timestamp"`
	ReceivedAt  string `json:"received_at"`
}

func fetchRenderedHTML(targetURL string) (string, error) {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
    	// chromedp logging flags removed due to unsupported exec pool

    	chromedp.Flag("headless", true),
    	chromedp.Flag("disable-gpu", true),
    	chromedp.Flag("no-sandbox", true),
    	chromedp.ExecPath("/usr/bin/chromium-browser"),
    )
    
    allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(), opts...)

	defer allocCancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()
	ctx, cancel = context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	var html string
	err := chromedp.Run(ctx,
		chromedp.Navigate(targetURL),
		chromedp.WaitReady("body", chromedp.ByQuery),
		chromedp.Sleep(2*time.Second),
		chromedp.Evaluate(`window.scrollTo(0, document.body.scrollHeight)`, nil),
		chromedp.Sleep(2*time.Second),
		chromedp.OuterHTML("html", &html),
	)
	if err != nil {
		return "", err
	}
	return html, nil
}

func main() {
	topic := "sitemap.entries"
	groupID := "story-fetcher-v1-dev"

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{"kafka:9092"},
		GroupID:        groupID,
		Topic:          topic,
		MinBytes:       1e3,
		MaxBytes:       10e6,
		GroupBalancers: []kafka.GroupBalancer{kafka.RangeGroupBalancer{}},
	})
	defer r.Close()

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers: []string{"kafka:9092"},
		Topic:  "story.cleaned",
	})
	defer writer.Close()

	log.Println("[story-fetcher] Listening to", topic)

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			if err.Error() != "EOF" {
				log.Printf("Read error: %v", err)
			}
			continue
		}

		debugLog("Raw Kafka message: %s", string(m.Value))

		var su StoryURL
		err = json.Unmarshal(m.Value, &su)
		if err != nil {
			log.Printf("Unmarshal error: %v", err)
			continue
		}

		log.Printf("Fetching: %s", su.URL)
		html, err := fetchRenderedHTML(su.URL)
		if err != nil {
			log.Printf("Headless fetch error [%s]: %v", su.URL, err)
			continue
		}

		parsedURL, err := url.Parse(su.URL)
		if err != nil {
			log.Printf("Invalid URL: %s", su.URL)
			continue
		}

		article, err := readability.FromReader(strings.NewReader(html), parsedURL)
		if err != nil {
			log.Printf("Readability parse error: %v", err)
			continue
		}

		if strings.Contains(strings.ToLower(article.Title), "video") && len(article.TextContent) < 400 {
			log.Printf("Skipping likely video-only page: %s", su.URL)
			continue
		}

		hasVideo := strings.Contains(strings.ToLower(html), "<video")

		cleaned := CleanedStory{
			URL:        su.URL,
			Title:      article.Title,
			Author:     article.Byline,
			Excerpt:    article.Excerpt,
			Content:    article.TextContent,
			HasVideo:   hasVideo,
			Source:     su.Source,
			Section:    su.Section,
			OriginalTS: su.PubDate,
			ReceivedAt: time.Now().Format(time.RFC3339),
		}

		output, _ := json.MarshalIndent(cleaned, "", "  ")
		log.Printf("✅ Cleaned article: %s\n%s", su.URL, output)

		msg, _ := json.Marshal(cleaned)
		err = writer.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(su.URL),
			Value: msg,
		})
		if err != nil {
			log.Printf("Kafka write error: %v", err)
			continue
		}
	}
}
