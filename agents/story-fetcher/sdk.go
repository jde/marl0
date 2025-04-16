package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	ProcessedTotal = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "agent_processed_total",
		Help: "Total messages processed",
	})
	ErrorsTotal = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "agent_errors_total",
		Help: "Total processing errors",
	})
)

func InitAgent() context.Context {
	agentName := os.Getenv("AGENT_NAME")
	agentVersion := os.Getenv("AGENT_VERSION")
	groupInstance := os.Getenv("GROUP_INSTANCE")

	if agentName == "" || agentVersion == "" || groupInstance == "" {
		log.Fatal("Missing required environment variables: AGENT_NAME, AGENT_VERSION, GROUP_INSTANCE")
	}

	agentID := fmt.Sprintf("%s-%s-%s", agentName, agentVersion, groupInstance)
	log.Printf("[agent] Starting agent: %s", agentID)

	prometheus.MustRegister(ProcessedTotal, ErrorsTotal)
	startMetricsServer(agentName)

	return context.Background()
}

func startMetricsServer(agent string) {
	port := os.Getenv("METRICS_PORT")
	if port == "" {
		port = "9100"
	}

	http.Handle("/metrics", promhttp.Handler())
	go func() {
		log.Printf("[metrics] Prometheus metrics for %s on :%s/metrics", agent, port)
		err := http.ListenAndServe(":"+port, nil)
		if err != nil {
			log.Fatalf("Failed to start metrics server: %v", err)
		}
	}()
}
