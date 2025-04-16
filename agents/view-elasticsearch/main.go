package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/segmentio/kafka-go"
	es "github.com/elastic/go-elasticsearch/v8"
)

type FirehoseEvent struct {
	EventType  string `json:"event_type"`  // "entity.created", "classification.added"
	SubjectID  string `json:"subject_id"`  // entity or classification ID
	Timestamp  string `json:"timestamp"`   // ISO timestamp
	Experiment string `json:"experiment"`  // optional
}

var (
	kafkaTopic   = "marl0.firehose"
	groupID      = "view-elasticsearch-00001"
	productAPI   = os.Getenv("PRODUCT_API_URL")
	experiment   = os.Getenv("EXPERIMENT") // optional
)
var esClient *es.Client

func main() {
	log.Printf("🧠 view-elasticsearch starting. Subscribing to %s", kafkaTopic)

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  strings.Split(os.Getenv("KAFKA_BROKERS"), ","),
		GroupID:  groupID,
		Topic:    kafkaTopic,
		MinBytes: 1e3,
		MaxBytes: 10e6,
	})
	defer r.Close()

	cfg := es.Config{
		Addresses: []string{
			"http://elasticsearch:9200",
		},
	}
	client, err := es.NewClient(cfg)
	if err != nil {
		log.Fatalf("❌ Elasticsearch client error: %v", err)
		return
	}
	log.Printf("✅ Elasticsearch client initialized")
	esClient = client

	for {
		msg, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Kafka read error: %v", err)
			continue
		}

		var event FirehoseEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("⚠️ Unmarshal failed: %v", err)
			continue
		}

		log.Printf("🔍 Event: %+v", event)

		// if experiment != "" && event.Experiment != experiment {
		// 	continue // skip non-matching experiments
		// }

		switch event.EventType {
		case "entity.created":
			handleEntity(event.SubjectID)
		default:
			log.Printf("🔍 Ignoring event type: %s", event.EventType)
		}
	}
}

func handleEntity(entityID string) {
	resp, err := http.Get(fmt.Sprintf("%s/api/product/entity?id=%s", productAPI, entityID))
	if err != nil {
		log.Printf("❌ Failed to fetch entity: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("⚠️ Entity fetch failed for %s: %d", entityID, resp.StatusCode)
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		log.Printf("⚠️ Entity JSON decode failed: %v", err)
		return
	}

	jsonBody, _ := json.Marshal(body)
	res, err := esClient.Index("entities", strings.NewReader(string(jsonBody)))
	if err != nil {
		log.Printf("❌ Elasticsearch index error: %v", err)
		return
	}
	defer res.Body.Close()

	if res.IsError() {
		log.Printf("⚠️ Failed to index entity: %s", res.String())
	} else {
		log.Printf("✅ Indexed entity %s", entityID)
	}

	log.Printf("📦 Indexed entity %s: %+v", entityID, body)
}
