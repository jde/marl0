// story-writer.go (specialized for news stories with classification)
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
)

var debugMode = strings.ToLower(os.Getenv("LOG_LEVEL")) == "debug"

func debugLog(msg string, args ...any) {
	if debugMode {
		log.Printf("[debug] "+msg, args...)
	}
}

type CleanedStory struct {
	URL        string `json:"url"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	Excerpt    string `json:"excerpt"`
	Content    string `json:"content"`
	HasVideo   bool   `json:"has_video"`
	Source     string `json:"source"`
	Section    string `json:"section"`
	OriginalTS string `json:"original_timestamp"`
	ReceivedAt string `json:"received_at"`
}

type Classification struct {
	EntityID   string  `json:"entityId"`
	Name       string  `json:"name"`
	Value      string  `json:"value"`
	Confidence float64 `json:"confidence,omitempty"`
}

type AgentContext struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Version     string `json:"version"`
	AgentKind   string `json:"agentKind"`
	AgentMethod string `json:"agentMethod"`
}

type ActivityDetails struct {
	Action    string `json:"action"`
	Timestamp string `json:"timestamp"`
}

type CreateEntityRequest struct {
	Payload         any              `json:"payload"`
	Classifications []Classification `json:"classifications"`
}

type CreateActivityRequest struct {
	Actor             string                `json:"actor"`
	Agent             AgentContext          `json:"agent"`
	Version           string                `json:"version"`
	Activity          ActivityDetails       `json:"activity"`
	UsedEntityIds     []string              `json:"usedEntityIds"`
	GeneratedEntities []CreateEntityRequest `json:"generatedEntities"`
	ObservedAt        string                `json:"observed_at"`
}

func postToProductAPI(payload CreateActivityRequest) error {
	url := os.Getenv("PRODUCT_API_URL")
	if url == "" {
		url = "http://product-api:3000/api/product/perform/activity"
	}

	buf, _ := json.Marshal(payload)
	res, err := http.Post(url, "application/json", strings.NewReader(string(buf)))
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		return fmt.Errorf("Product API error: status %d", res.StatusCode)
	}
	return nil
}

func main() {
	topic := "story.cleaned"
	agent := "story-writer"
	version := "v1"
	groupID := fmt.Sprintf("%s-%s-%s", agent, version, os.Getenv("GROUP_INSTANCE"))

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{"kafka:9092"},
		GroupID:        groupID,
		Topic:          topic,
		MinBytes:       1e3,
		MaxBytes:       10e6,
		GroupBalancers: []kafka.GroupBalancer{kafka.RangeGroupBalancer{}},
	})
	defer r.Close()

	log.Printf("[%s] Listening on %s", agent, topic)

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			if err.Error() != "EOF" {
				log.Printf("Read error: %v", err)
			}
			continue
		}

		var story CleanedStory
		if err := json.Unmarshal(m.Value, &story); err != nil {
			log.Printf("Unmarshal error: %v", err)
			continue
		}

		classifications := []Classification{
			{Name: "url", Value: story.URL},
			{Name: "source", Value: story.Source},
			{Name: "section", Value: story.Section},
			{Name: "specificity", Value: "compound"},
			{Name: "provider", Value: "progenitor"},
		}
		if story.HasVideo {
			classifications = append(classifications, Classification{
				Name:  "media_format",
				Value: "video",
			})
		}

		activity := CreateActivityRequest{
			Actor: agent,
			Agent: AgentContext{
				ID:          agent,
				Name:        agent,
				Version:     version,
				AgentKind:   "automated",
				AgentMethod: "scrape+classify",
			},
			Version: version,
			Activity: ActivityDetails{
				Action:    "StoryIngest",
				Timestamp: time.Now().Format(time.RFC3339),
			},
			UsedEntityIds: []string{},
			GeneratedEntities: []CreateEntityRequest{
				{
					Payload:         story,
					Classifications: classifications,
				},
			},
			ObservedAt: story.ReceivedAt,
		}

		debugLog("Posting story: %s", story.URL)
		err = postToProductAPI(activity)
		if err != nil {
			log.Printf("Product API error: %v", err)
			continue
		}
		log.Printf("✅ Wrote story to Product API: %s", story.URL)
	}
}
