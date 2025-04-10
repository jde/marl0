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

rebuild-%:
	$(DC) build --no-cache $*
	$(DC) up -d --force-recreate $*

## Start stack in detached mode
up: validate
	$(DC) up -d

## Stop running containers
stop:
	$(DC) stop

# 🧩 Restart specific service
restart-%:
	@echo "🔄 Restarting service: $*"
	$(DC) stop $*
	$(DC) up -d $*


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

LOCAL_LLM_MODEL ?= $(shell grep LOCAL_LLM_MODEL .env.dev | cut -d '=' -f2)

local-llm-up:
	docker-compose --env-file .env.dev up -d local-llm

local-llm-down:
	docker-compose --env-file .env.dev down --remove-orphans --volumes local-llm || true

pull-llm-model:
	@echo "🔁 Pulling model: $(LOCAL_LLM_MODEL)"
	docker-compose --env-file .env.dev exec local-llm ollama pull $(LOCAL_LLM_MODEL)


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
	@echo "🚀 Initializing local LLM environment with model: $(LOCAL_LLM_MODEL)"
	$(MAKE) local-llm-down
	$(MAKE) local-llm-up
	$(MAKE) pull-llm-model
	$(MAKE) wait-for-local-llm
	@echo "✅ Local LLM environment is ready!"


# 🧩 Snapshot all dashboards from Grafana
GRAFANA_USER ?= admin
GRAFANA_PASS ?= admin
GRAFANA_URL ?= http://localhost:4205

snapshot-grafana:
	@echo "📸 Exporting dashboards from Grafana..."
	mkdir -p monitoring/grafana/dashboards
	@curl -s -u $(GRAFANA_USER):$(GRAFANA_PASS) $(GRAFANA_URL)/api/search?query=&type=dash-db \
		> /tmp/grafana_dash_list.json
	@jq -c '.[]' /tmp/grafana_dash_list.json | while read -r dashboard; do \
		uid=$$(echo $$dashboard | jq -r '.uid'); \
		title=$$(echo $$dashboard | jq -r '.title' | tr ' ' '_' | tr -cd '[:alnum:]_-'); \
		if [ -n "$$uid" ] && [ -n "$$title" ]; then \
			echo "💾 Saving dashboard: $$title.json"; \
			curl -s -u $(GRAFANA_USER):$(GRAFANA_PASS) $(GRAFANA_URL)/api/dashboards/uid/$$uid \
				| jq '.dashboard' > monitoring/grafana/dashboards/$$title.json; \
		fi \
	done
	@echo "✅ All dashboards saved to monitoring/grafana/dashboards/"

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
