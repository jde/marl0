import express from 'express';
import client from 'prom-client';
import { config } from './config';

const app = express();

// Create Prometheus metrics
export const messagesProduced = new client.Counter({
  name: 'marl0_ingestor_hhgg_messages_total',
  help: 'Total number of messages produced by the HHGG ingestor'
});

export const messagesErrored = new client.Counter({
  name: 'marl0_ingestor_hhgg_errors_total',
  help: 'Total number of errors in the HHGG ingestor'
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

export const kafkaConnectionErrors = new client.Counter({
  name: 'marl0_ingestor_hhgg_kafka_connection_errors_total',
  help: 'Total number of Kafka connection errors'
});

export function startMetricsServer() {
  app.listen(config.metricsPort, () => {
    console.log(`✅ Metrics server running at http://localhost:${config.metricsPort}/metrics`);
  });
}
