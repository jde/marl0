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
)

type FirehoseEvent struct {
	EventType  string `json:"event_type"`  // "entity.created", "classification.added"
	SubjectID  string `json:"subject_id"`  // entity or classification ID
	Timestamp  string `json:"timestamp"`   // ISO timestamp
	Experiment string `json:"experiment"`  // optional
}

var (
	kafkaTopic   = "marl0.firehose"
	groupID      = "view-elasticsearch"
	productAPI   = os.Getenv("PRODUCT_API_URL")
	experiment   = os.Getenv("EXPERIMENT") // optional
)

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

		if experiment != "" && event.Experiment != experiment {
			continue // skip non-matching experiments
		}

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

	// TODO: Push to Elasticsearch
	log.Printf("📦 Indexed entity %s: %+v", entityID, body)
}
