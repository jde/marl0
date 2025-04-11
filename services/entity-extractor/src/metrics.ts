import express from 'express';
import client, { Counter, Histogram } from 'prom-client';

const app = express();

// ✅ Collect default Node.js metrics (event loop, memory, etc.)
client.collectDefaultMetrics();

export const messageProcessingDuration = new Histogram({
  name: 'entity_extractor_message_duration_seconds',
  help: 'Duration of entity extraction per message',
  buckets: [0.1, 1, 10, 20, 30, 40, 50, 60, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200], // seconds
});

// 🧩 Custom metrics

export const messagesConsumed = new Counter({
  name: 'entity_extractor_messages_consumed_total',
  help: 'Total number of Kafka messages consumed',
});

export const llmRequests = new Counter({
  name: 'entity_extractor_llm_requests_total',
  help: 'Total number of LLM requests made',
});

export const llmFailures = new Counter({
  name: 'entity_extractor_llm_failures_total',
  help: 'Number of LLM calls that failed',
});

export const extractedEntities = new Counter({
  name: 'entity_extractor_entities_extracted_total',
  help: 'Total number of entities extracted',
});

export const postgresInserts = new Counter({
  name: 'entity_extractor_postgres_inserts_total',
  help: 'Entities successfully written to Postgres',
});

export const extractionFailures = new Counter({
  name: 'entity_extractor_extraction_failures_total',
  help: 'Number of LLM or JSON parse failures',
});

// ✅ Serve /metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(3000, () => {
  console.log('✅ Metrics server running at http://localhost:3000/metrics');
});
