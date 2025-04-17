package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"github.com/segmentio/kafka-go"
)

type FirehoseEvent struct {
	EventType           string   `json:"event_type"`
	EntityID            string   `json:"entity_id,omitempty"`
	UsedEntityIds       []string `json:"used_entity_ids,omitempty"`
	ActivityID          string   `json:"activity_id"`
	ClassificationID    string   `json:"classification_id,omitempty"`
	ClassificationName  string   `json:"classification_name,omitempty"`
	ClassificationValue string   `json:"classification_value,omitempty"`
	Timestamp           string   `json:"timestamp"`
	Experiment          string   `json:"experiment,omitempty"`
}

var (
	kafkaTopic   = "marl0.firehose"
	groupID      = "view-memgraph-0003"
	kafkaBrokers = strings.Split(os.Getenv("KAFKA_BROKERS"), ",")
	memgraphURI  = os.Getenv("MEMGRAPH_URI") // e.g. bolt://memgraph:7687
)

func main() {
	log.Println("🧠 view-memgraph starting...")

	driver, err := neo4j.NewDriverWithContext(memgraphURI, neo4j.NoAuth())
	if err != nil {
		log.Fatalf("Failed to connect to Memgraph: %v", err)
	}
	defer driver.Close(context.Background())

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  kafkaBrokers,
		GroupID:  groupID,
		Topic:    kafkaTopic,
		MinBytes: 1e3,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("❌ Kafka read error: %v", err)
			continue
		}

		var event FirehoseEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("❌ Failed to parse event: %v", err)
			continue
		}

		log.Printf("🔍 Firehose Event: %+v", event)

		switch event.EventType {
		case "entity.created":
			if err := upsertEntity(driver, event.EntityID); err != nil {
				log.Printf("❌ Failed to index entity: %v", err)
			} else {
				log.Printf("✅ Successfully indexed entity: %s", event.EntityID)
			}
		case "classification.added":
			if err := upsertClassification(driver, event.ClassificationID); err != nil {
				log.Printf("❌ Failed to index classification: %v", err)
			} else {
				log.Printf("✅ Successfully indexed classification: %s", event.ClassificationID)
			}
		default:
			log.Printf("⚠️ Unhandled event type: %s", event.EventType)
		}
	}
}

func upsertEntity(driver neo4j.DriverWithContext, entityId string) error {
	url := fmt.Sprintf("%s/api/product/entity?id=%s", os.Getenv("PRODUCT_API_URL"), entityId)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to fetch entity view: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("entity view error [%d]: %s", resp.StatusCode, body)
	}

	var parsed struct {
		Entity struct {
			ID          string                 `json:"id"`
			Payload     map[string]interface{} `json:"payload"`
			CreatedAt   string                 `json:"createdAt"`
			CreatedById string                 `json:"createdById"`
			GeneratedBy struct {
				ID            string   `json:"id"`
				Kind          string   `json:"action"`
				Timestamp     string   `json:"timestamp"`
				UsedEntityIds []string `json:"usedEntityIds"`
				Agent         struct {
					ID      string `json:"id"`
					Name    string `json:"name"`
					Version string `json:"version"`
					Kind    string `json:"kind"`
					Method  string `json:"method"`
				} `json:"agent"`
			} `json:"outputFrom"`
			Classifications []struct {
				ID string `json:"id"`
			} `json:"classifications"`
		} `json:"entity"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return fmt.Errorf("json decode error: %w", err)
	}

	session := driver.NewSession(context.Background(), neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(context.Background())

	_, err = session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		query := `
			MERGE (e:Entity {id: $entityId})
			SET e.payload = $payload, e.createdAt = $createdAt

			MERGE (a:Activity {id: $activityId})
			SET a.kind = $kind, a.timestamp = $activityTimestamp

			MERGE (a)-[:GENERATED]->(e)

			MERGE (agent:Agent {id: $agentId})
			SET agent.name = $agentName,
				agent.version = $agentVersion,
				agent.kind = $agentKind,
				agent.method = $agentMethod

			MERGE (a)-[:PERFORMED_BY]->(agent)
		`

		agentKind := parsed.Entity.GeneratedBy.Agent.Kind
		if agentKind == "" {
			agentKind = "automated"
		}
		agentMethod := parsed.Entity.GeneratedBy.Agent.Method
		if agentMethod == "" {
			agentMethod = "unknown"
		}

		params := map[string]any{
			"entityId":          parsed.Entity.ID,
			"payload":           parsed.Entity.Payload,
			"createdAt":         parsed.Entity.CreatedAt,
			"activityId":        parsed.Entity.GeneratedBy.ID,
			"kind":              parsed.Entity.GeneratedBy.Kind,
			"activityTimestamp": parsed.Entity.GeneratedBy.Timestamp,
			"usedEntityIds":     parsed.Entity.GeneratedBy.UsedEntityIds,
			"agentId":           parsed.Entity.GeneratedBy.Agent.ID,
			"agentName":         parsed.Entity.GeneratedBy.Agent.Name,
			"agentVersion":      parsed.Entity.GeneratedBy.Agent.Version,
			"agentKind":         agentKind,
			"agentMethod":       agentMethod,
		}

		unwindQuery := `
			UNWIND $usedEntityIds AS usedId
			MERGE (used:Entity {id: usedId})
			MERGE (a:Activity {id: $activityId})
			MERGE (a)-[:USED]->(used)
		`

		// Block 1: main insert
		_, err := tx.Run(context.Background(), query, params)

		// Block 2: only if used entities exist
		if len(parsed.Entity.GeneratedBy.UsedEntityIds) > 0 {
			_, err2 := tx.Run(context.Background(), unwindQuery, params)
			if err2 != nil {
				return nil, err2
			}
		}

		// Block 3: only if classification exists
		if len(parsed.Entity.Classifications) > 0 {
			for _, classification := range parsed.Entity.Classifications {
				if err := upsertClassification(driver, classification.ID); err != nil {
					return nil, err
				}
			}
		}

		return nil, err
	})

	return err
}

func upsertClassification(driver neo4j.DriverWithContext, classificationId string) error {
	url := fmt.Sprintf("%s/api/product/classification?id=%s", os.Getenv("PRODUCT_API_URL"), classificationId)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to fetch classification: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("classification fetch error [%d]: %s", resp.StatusCode, body)
	}

	var c struct {
		ID           string   `json:"id"`
		Name         string   `json:"name"`
		Value        string   `json:"value"`
		Confidence   *float64 `json:"confidence"`
		Namespace    *string  `json:"namespace"`
		Timestamp    string   `json:"timestamp"`
		EntityID     string   `json:"entityId"`
		ActivityID   *string  `json:"activityId"`
		SupersedesID *string  `json:"supersedesId"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&c); err != nil {
		return fmt.Errorf("failed to decode classification JSON: %w", err)
	}

	session := driver.NewSession(context.Background(), neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(context.Background())

	_, err = session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		query := `
			MERGE (e:Entity {id: $entityId})
			MERGE (c:Classification {id: $id})
			SET c.name = $name,
				c.value = $value,
				c.timestamp = $timestamp,
				c.confidence = $confidence,
				c.namespace = $namespace

			MERGE (c)-[:CLASSIFIES]->(e)

			WITH c
			OPTIONAL MATCH (a:Activity {id: $activityId})
			FOREACH (_ IN CASE WHEN a IS NOT NULL THEN [1] ELSE [] END |
				MERGE (c)-[:ASSIGNED_BY]->(a)
			)

			WITH c
			OPTIONAL MATCH (s:Classification {id: $supersedesId})
			FOREACH (_ IN CASE WHEN s IS NOT NULL THEN [1] ELSE [] END |
				MERGE (c)-[:SUPERSEDES]->(s)
			)
		`

		params := map[string]any{
			"id":           c.ID,
			"name":         c.Name,
			"value":        c.Value,
			"timestamp":    c.Timestamp,
			"confidence":   c.Confidence,
			"namespace":    c.Namespace,
			"entityId":     c.EntityID,
			"activityId":   c.ActivityID,
			"supersedesId": c.SupersedesID,
		}

		_, err := tx.Run(context.Background(), query, params)
		return nil, err
	})

	return err
}
