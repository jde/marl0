package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
)

type MentionEnvelope struct {
	SourceEntityID string `json:"source_entity_id"`
	SourceAgentID  string `json:"source_agent_id"`
	Model          string `json:"llm_model"`

	Mention Mention `json:"mention"`
}

type ActivityVia struct {
	SourceAgentID      string         `json:"sourceAgentId"`
	SourceAgentName    string         `json:"sourceAgentName,omitempty"`
	SourceAgentVersion string         `json:"sourceAgentVersion,omitempty"`
	SourceEntityID     string         `json:"sourceEntityId"`
	Timestamp          string         `json:"timestamp"`
	MessageType        string         `json:"messageType"` // e.g. "mention", "quote", "claim"
	Payload            map[string]any `json:"payload"`
	Metadata           map[string]any `json:"metadata,omitempty"` // optional extras like index, score, tags
}

type Mention map[string]any

type EntityMentions struct {
	Entities []Mention `json:"entities"`
}

type FirehoseEvent struct {
	EventType string `json:"event_type"`
	EntityID  string `json:"entity_id"`
}

type Agent struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Version     string `json:"version"`
	AgentKind   string `json:"agentKind"`
	AgentMethod string `json:"agentMethod"`
}

func main() {
	broker := os.Getenv("KAFKA_BROKERS")
	if broker == "" {
		broker = "localhost:9092"
	}

	groupID := os.Getenv("MENTION_EXTRACTOR_GROUP_ID")
	if groupID == "" {
		groupID = "mention-extractor"
	}

	fmt.Printf("🔍 Listening to marl0.firehose, groupID: %s\n", groupID)

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{broker},
		GroupID: groupID,
		Topic:   "marl0.firehose",
	})
	defer r.Close()

	fmt.Println("📡 Listening to marl0.firehose...")

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			fmt.Println("❌ Read error:", err)
			continue
		}

		var event FirehoseEvent
		if err := json.Unmarshal(m.Value, &event); err != nil || event.EventType != "entity.created" {
			continue
		}

		entity, err := fetchEntity(event.EntityID)
		if err != nil {
			log.Println("Fetch from product-api failed:", err)
			continue
		}

		if !isMentionable(entity) {
			fmt.Printf("❌ Not mentionable: %s\n", event.EntityID)
			continue
		}

		mentions := extractMentions(entity)
		if len(mentions) == 0 {
			continue
		}

		model := os.Getenv("OLLAMA_MODEL")
		if model == "" {
			model = "openhermes"
		}

		for _, mention := range mentions {

			// Create entity via activity
			activity := ActivityPostRequest{
				Agent: struct {
					ID          string `json:"id"`
					Name        string `json:"name"`
					Version     string `json:"version"`
					AgentKind   string `json:"agentKind"`
					AgentMethod string `json:"agentMethod"`
				}{
					ID:          os.Getenv("AGENT_ID"),
					Name:        os.Getenv("AGENT_NAME"),
					Version:     os.Getenv("AGENT_VERSION"),
					AgentKind:   "automated",
					AgentMethod: "mention-extraction",
				},
				Activity: struct {
					Action    string         `json:"action"`
					Timestamp time.Time      `json:"timestamp"`
					Via       map[string]any `json:"via,omitempty"`
				}{
					Action:    "create",
					Timestamp: time.Now(),
					Via:       map[string]any{},
				},
				UsedEntityIDs: []string{event.EntityID},
				GeneratedEntities: []GeneratedEntity{
					{
						Payload: mention,
						Classifications: []Classification{
							{
								Name:  "type",
								Value: "mention",
							},
							{
								Name:  "llm_model",
								Value: model,
							},
						},
					},
				},
			}

			apiURL := os.Getenv("PRODUCT_API_URL")
			if apiURL == "" {
				apiURL = "http://localhost:42420"
			}
			apiURL = fmt.Sprintf("%s/api/product/perform/activity", apiURL)

			if err := PostActivity(apiURL, activity); err != nil {
				log.Printf("Failed to post activity: %v", err)
				continue
			}

			fmt.Printf("✅ Mention: %+v\n", mention)
		}
	}
}

func isMentionable(entity map[string]any) bool {
	classifications, ok := entity["classifications"].([]any)
	if !ok {
		return false
	}

	hasSpecificity := false
	hasProvider := false

	for _, c := range classifications {
		class := c.(map[string]any)
		name := class["name"].(string)
		value := class["value"].(string)

		if name == "specificity" && value == "compound" {
			hasSpecificity = true
		}
		if name == "provider" && value == "progenitor" {
			hasProvider = true
		}
	}

	return hasSpecificity && hasProvider
}

var fenced = regexp.MustCompile("(?s)```(?:json)?\\s*(.*?)\\s*```")

func cleanResponse(raw string) string {
	matches := fenced.FindStringSubmatch(raw)
	if len(matches) > 1 {
		return matches[1]
	}
	return raw
}

func extractMentions(entity map[string]any) []Mention {
	fmt.Printf("🔍 Extracting mentions from entity: %s\n", entity["id"])

	content := entity["payload"].(map[string]any)["content"].(string)
	prompt := buildPrompt(content)

	model := os.Getenv("OLLAMA_MODEL")
	if model == "" {
		model = "openhermes"
	}

	req := map[string]any{
		"model":       model,
		"prompt":      prompt,
		"stream":      false,
		"format":      "json",
		"temperature": 0.0,
	}
	reqBytes, _ := json.Marshal(req)

	ollamaURL := os.Getenv("OLLAMA_URL")
	if ollamaURL == "" {
		ollamaURL = "http://localhost:11434/api/generate"
	}

	resp, err := http.Post(ollamaURL, "application/json", bytes.NewBuffer(reqBytes))
	if err != nil {
		fmt.Printf("❌ LLM error for %s: %v\n", entity["id"], err)
		return nil
	}
	defer resp.Body.Close()

	var response map[string]any
	responseBytes, _ := io.ReadAll(resp.Body)

	if strings.Contains(string(responseBytes), "```") {
		fmt.Println("⚠️  Wrapped JSON detected — unwrapping...")
		responseBytes = []byte(cleanResponse(string(responseBytes)))
	}

	json.Unmarshal(responseBytes, &response)

	// fmt.Printf("🔍 LLM response: %s\n", response["response"])

	var mentions EntityMentions
	err = json.Unmarshal([]byte(response["response"].(string)), &mentions)
	if err != nil {
		fmt.Printf("❌ Failed to parse LLM response: %v\n", err)
		return nil
	}

	// fmt.Printf("✅ Found %d mention(s) from entity %s\n", len(mentions.Entities), entity["id"])

	return mentions.Entities
}

func buildPrompt(content string) string {
	example := `
You are a professional entity extraction engine. Your job is to identify all distinct named entities in a piece of text.

You must return a JSON array of objects. Each object must include:
- "type" (such as "person", "organization", "location", or "concept")
- "name" (the text of the entity)
- "description" (a short description of the entity as described in the text)

If the entity is a person, please include the person's title or role in the description.	

If a quote is attributed to an entity, please include the quote as a quote field. 

If the entity is an organization, please include the organization's industry in the description.

If the entity is a location, please include the location's country in the description.

If the entity is a concept, please include the concept's category in the description.

Please include any other relevant information in aptly named fields.


⚠️ Do not include explanations or extra text. Only return the JSON array.
`
	prompt := example + "\n" + strings.TrimSpace(content)

	return prompt
}
