import express, { Request, Response } from 'express';
import client from 'prom-client';

const app = express();
const register = new client.Registry();

export const messagesConsumed = new client.Counter({
  name: 'marl0_entity_extractor_messages_total',
  help: 'Total number of messages consumed',
});

export const extractionFailures = new client.Counter({
  name: 'marl0_entity_extractor_failures_total',
  help: 'Total number of extraction failures',
});

register.registerMetric(messagesConsumed);
register.registerMetric(extractionFailures);
client.collectDefaultMetrics({ register });

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000, () => {
  console.log('✅ Metrics server running at http://localhost:3000/metrics');
});
