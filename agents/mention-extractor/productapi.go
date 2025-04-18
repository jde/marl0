package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type Entity struct {
	ID              string           `json:"id"`
	Payload         map[string]any   `json:"payload"`
	CreatedByID     string           `json:"createdById"`
	CreatedAt       string           `json:"createdAt"`
	Classifications []Classification `json:"classifications"`
}

type Classification struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

func fetchEntity(entityID string) (map[string]any, error) {
	apiHost := os.Getenv("PRODUCT_API_URL")
	if apiHost == "" {
		apiHost = "http://localhost:42420"
	}

	url := fmt.Sprintf("%s/api/product/entity?id=%s", apiHost, entityID)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("HTTP error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("product-api returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result map[string]any
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("JSON parse error: %w", err)
	}

	entity, ok := result["entity"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("missing 'entity' in response")
	}

	return entity, nil
}

type ActivityPostRequest struct {
	Agent struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Version     string `json:"version"`
		AgentKind   string `json:"agentKind"`   // e.g. "automated"
		AgentMethod string `json:"agentMethod"` // e.g. "mention-normalization"
	} `json:"agent"`
	Activity struct {
		Action    string         `json:"action"`
		Timestamp time.Time      `json:"timestamp"`
		Via       map[string]any `json:"via,omitempty"` // Optional
	} `json:"activity"`
	UsedEntityIDs     []string          `json:"usedEntityIds"`
	GeneratedEntities []GeneratedEntity `json:"generatedEntities,omitempty"`
}

type GeneratedEntity struct {
	Payload         map[string]any   `json:"payload"`
	Classifications []Classification `json:"classifications,omitempty"`
}

func PostActivity(apiURL string, req ActivityPostRequest) error {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal activity: %w", err)
	}

	resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("post error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("product-api returned status %d", resp.StatusCode)
	}

	return nil
}
