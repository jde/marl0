import express from 'express';
import client, { Counter } from 'prom-client';

// ✅ Define extractionFailures
export const extractionFailures = new Counter({
  name: 'entity_extractor_extraction_failures_total',
  help: 'Number of LLM or JSON parse failures',
});

// ✅ Define postgresInserts
export const postgresInserts = new Counter({
  name: 'entity_extractor_postgres_inserts_total',
  help: 'Number of successful entity inserts into Postgres',
});

const app = express();

// ✅ Collect default Node.js metrics (event loop, memory, etc.)
client.collectDefaultMetrics();

// 🧩 Custom metrics
export const messagesConsumed = new client.Counter({
  name: 'entity_extractor_messages_consumed_total',
  help: 'Total number of messages consumed by entity-extractor',
});

export const llmRequests = new client.Counter({
  name: 'entity_extractor_llm_requests_total',
  help: 'Total LLM requests made',
});

export const llmFailures = new client.Counter({
  name: 'entity_extractor_llm_failures_total',
  help: 'LLM request failures',
});

export const extractedEntities = new client.Counter({
  name: 'entity_extractor_entities_extracted_total',
  help: 'Total number of extracted entities'
});

// ✅ Serve /metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(4242, () => {
  console.log('✅ Metrics server running at http://localhost:4242/metrics');
});
