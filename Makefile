# 🧩 Makefile — Fully ergonomic, validated, and pro-grade 🚀

# ===============================
# Variables
# ===============================

ENV ?= dev
TAIL ?= 100

# Define Docker Compose runner, using your custom script
DC = ENVIRONMENT=$(ENV) ./docker-run.sh

# Services in your docker-compose.yml
SERVICES = app ingestor kafka zookeeper postgres lancedb memgraph redis minio prometheus grafana

# List of required environment files
ENV_FILES = .env.$(ENV)

# List of required bind-mounted files and directories
REQUIRED_PATHS = \
	monitoring/prometheus.yml \
	docker_data/lancedb \
	docker_data/postgres \
	docker_data/memgraph \
	docker_data/redis \
	docker_data/minio \
	docker_data/grafana

# ===============================
# 🧩 Safety Checks
# ===============================

## Validate environment files and bind-mount paths
validate:
	@echo "🔍 Validating environment and required paths..."
	@for file in $(ENV_FILES); do \
		if [ ! -f $$file ]; then \
			echo "❌ Missing environment file: $$file"; \
			exit 1; \
		fi; \
	done
	@for path in $(REQUIRED_PATHS); do \
		if [ ! -e $$path ]; then \
			echo "❌ Missing required path: $$path"; \
			exit 1; \
		fi; \
	done
	@echo "✅ All required environment files and paths are present!"

# ===============================
# 🧩 Core Targets
# ===============================

## Rebuild and run stack in detached mode
rebuild: validate
	$(DC) build --no-cache
	$(DC) up -d --force-recreate

## Start stack in detached mode
up: validate
	$(DC) up -d

## Stop running containers
stop:
	$(DC) stop

## Stop and remove containers, networks, and volumes
down:
	$(DC) down --volumes --remove-orphans

## Show running services
ps:
	$(DC) ps

## Show effective docker-compose config
config:
	$(DC) config

# ===============================
# 🧩 Logs
# ===============================

## Tail all services logs
logs:
	$(DC) logs -f --tail=$(TAIL)

## Tail logs for a specific service (usage: make logs-service)
logs-%:
	$(DC) logs -f $*

# ===============================
# 🧩 Build specific services
# ===============================

## Build a specific service (usage: make build-service)
build-%:
	$(DC) build --no-cache $*

# ===============================
# 🧩 Local LLM Flow
# ===============================

MODEL_NAME ?= tinyllama

local-llm-up:
	docker-compose --env-file .env.dev up -d local-llm

local-llm-down:
	docker-compose --env-file .env.dev down --remove-orphans --volumes local-llm || true

pull-llm-model:
	docker-compose --env-file .env.dev exec local-llm ollama pull $(MODEL_NAME)

list-llm-models:
	docker-compose --env-file .env.dev exec local-llm ollama list

logs-local-llm:
	ENVIRONMENT=dev ./docker-run.sh logs -f local-llm

wait-for-local-llm:
	@echo "🕒 Waiting for local-llm healthcheck to pass..."
	@until docker inspect --format='{{.State.Health.Status}}' marl0-local-llm-1 | grep healthy > /dev/null; do \
		sleep 2; \
	done
	@echo "✅ local-llm is healthy!"

# 🧩 Init Local LLM Environment
init-local-llm:
	@echo "🚀 Initializing local LLM environment with model: $(model)"
	$(MAKE) local-llm-down
	$(MAKE) local-llm-up
	$(MAKE) pull-llm-model MODEL_NAME=$(model)
	$(MAKE) wait-for-local-llm
	@echo "✅ Local LLM environment is ready!"

# ===============================
# 🧩 Help
# ===============================

## Show this help message
help:
	@echo "🚀 Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "💡 Pro tip: Add ENV=prod for production config"
	@echo "💡 Pro tip: Add TAIL=500 for deeper log tailing"
	@echo "💡 Pro tip: Use 'make logs-<service>' for specific logs"

# ===============================
# 🧩 Phony Targets
# ===============================

.PHONY: $(SERVICES) rebuild up stop down ps config validate logs logs-% build-% help

# ===============================
# 🧩 Default target
# ===============================

.DEFAULT_GOAL := help
