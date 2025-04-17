.PHONY: reset repopulate logs build up

# You can change these if you namespace your Kafka or service
KAFKA_CONTAINER ?= marl0-kafka-1
MEMGRAPH_URL ?= bolt://localhost:7687
KAFKA_TOPIC ?= marl0.firehose
KAFKA_GROUP ?= view-memgraph
KAFKA_BROKER ?= localhost:9092

ENV_FILE ?= ../../.env.dev

reset:
	@echo "🧨 Wiping Memgraph nodes + relationships..."
	echo "MATCH (n) DETACH DELETE n;" | docker exec -i marl0-memgraph-1 mgconsole
	