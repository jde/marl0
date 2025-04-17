package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"bytes"
	"io"

	"github.com/segmentio/kafka-go"
	opensearch "github.com/opensearch-project/opensearch-go"
)

type FirehoseEvent struct {
	EventType  string `json:"event_type"`  // "entity.created", "classification.added"
	EntityID  string `json:"entity_id"`  // entity or classification ID
	Timestamp  string `json:"timestamp"`   // ISO timestamp
	Experiment string `json:"experiment"`  // optional
}

var (
	kafkaTopic   = "marl0.firehose"
	groupID      = "view-elasticsearch-00004"
	productAPI   = os.Getenv("PRODUCT_API_URL")
	experiment   = os.Getenv("EXPERIMENT") // optional
)
var opensearchClient *opensearch.Client

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

	cfg := opensearch.Config{
		Addresses: []string{
			"http://elasticsearch:9200",
		},
	}
	client, err := opensearch.NewClient(cfg)
	if err != nil {
		log.Fatalf("❌ Elasticsearch client error: %v", err)
		return
	}
	log.Printf("✅ Elasticsearch client initialized")
	opensearchClient = client

	for {
		msg, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Kafka read error: %v", err)
			continue
		}

		log.Printf("🔍 Message: %s", string(msg.Value))

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
			handleEntity(event.EntityID)
		default:
			log.Printf("🔍 Ignoring event type: %s", event.EventType)
		}
	}
}

func handleEntity(EntityID string) {
	resp, err := http.Get(fmt.Sprintf("%s/api/product/entity?id=%s", productAPI, EntityID))
	if err != nil {
		log.Printf("❌ Failed to fetch entity: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("⚠️ Entity fetch failed: %d", resp.StatusCode)
		data, _ := io.ReadAll(resp.Body)
		log.Printf("⚠️ Body: %s", string(data))
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		log.Printf("⚠️ JSON decode failed: %v", err)
		return
	}

	log.Printf("🔍 Entity: %+v", body)

	
	jsonBody, err := json.Marshal(body)
	if err != nil {
		log.Printf("❌ Failed to marshal entity: %v", err)
		return
	}

	log.Printf("🔍 Indexing document: %s", string(jsonBody))

	res, err := opensearchClient.Index("entities", bytes.NewReader(jsonBody))
	if err != nil {
		log.Printf("❌ Elasticsearch index error: %v", err)
		return
	}
	defer res.Body.Close()

	if res.IsError() {
		var esErr map[string]interface{}
		json.NewDecoder(res.Body).Decode(&esErr)
		log.Printf("⚠️ Failed to index entity: %v", esErr)
	} else {
		log.Printf("✅ Indexed entity")
	}

	log.Printf("📦 Indexed entity %s: %+v", EntityID, body)
}
