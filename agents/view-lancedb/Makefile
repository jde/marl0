.PHONY: dev build logs reset

# Run the agent locally using .env vars and venv
dev: worker api

worker:
	@echo "🚀 Running firehose worker..."
	@bash -c ' \
		set -a && [ -f .env.local ] && . .env.local && set +a && \
		source .venv/bin/activate && \
		python main.py \
	'

api:
	@echo "🚀 Starting similarity API..."
	@bash -c ' \
		set -a && [ -f .env.local ] && . .env.local && set +a && \
		source .venv/bin/activate && \
		uvicorn app:app --host 0.0.0.0 --port 8080 \
	'

reset:
	rm -rf ./lancedb_data

replay: stop
	@echo "🔁 Resetting Kafka group offset for $(KAFKA_GROUP)..."
	docker exec $(KAFKA_CONTAINER) kafka-consumer-groups.sh \
		--bootstrap-server kafka:9092 \
		--group $(KAFKA_GROUP) \
		--topic $(KAFKA_TOPIC) \
		--reset-offsets --to-earliest --execute || true