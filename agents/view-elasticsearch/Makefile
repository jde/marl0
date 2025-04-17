ES_URL ?= http://localhost:9200
INDEX_NAME ?= entities
MAPPING_FILE ?= ./mappings/entities.json

.PHONY: all reset create reindex build up logs

all: reset create

reset:
	@echo "🧨 Deleting index: $(INDEX_NAME)"
	curl -X DELETE "$(ES_URL)/$(INDEX_NAME)" || true

create:
	@echo "📐 Creating index: $(INDEX_NAME) with mapping from $(MAPPING_FILE)"
	curl -X PUT "$(ES_URL)/$(INDEX_NAME)" \
	  -H 'Content-Type: application/json' \
	  --data-binary "@$(MAPPING_FILE)"

reindex: reset create
