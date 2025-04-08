# Makefile — Fully ergonomic, validated, and pro-grade 🚀

# Variables
ENV ?= dev
DC = ENVIRONMENT=$(ENV) ./docker-run.sh
TAIL ?= 100

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

# 🧩 Safety Checks

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

# 🧩 Core Targets

rebuild: validate
	$(DC) build --no-cache
	$(DC) up -d --force-recreate

up: validate
	$(DC) up -d

stop:
	$(DC) stop

down:
	$(DC) down --volumes --remove-orphans

ps:
	$(DC) ps

config:
	$(DC) config

# 🧩 Logs

logs:
	$(DC) logs -f --tail=$(TAIL)

logs-%:
	$(DC) logs -f $*

# 🧩 Build specific services

build-%:
	$(DC) build --no-cache $*

# 🧩 Help

help:
	@echo "🚀 Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "💡 Pro tip: Add ENV=prod for production config"
	@echo "💡 Pro tip: Add TAIL=500 for deeper log tailing"

# 🧩 Add metadata for auto-help
rebuild: ## Rebuild and run stack in detached mode
up: ## Start stack in detached mode
stop: ## Stop running containers
down: ## Stop and remove containers, networks, and volumes
ps: ## Show running services
config: ## Show effective docker-compose config
validate: ## Validate environment and required bind-mount paths
logs: ## Tail all services logs
logs-%: ## Tail logs for a specific service (usage: make logs-service)
build-%: ## Build a specific service (usage: make build-service)
help: ## Show this help message

# 🧩 Default target
.DEFAULT_GOAL := help

# 🧩 Optional metadata
.PHONY: rebuild up stop down ps config validate logs logs-% build-% help
