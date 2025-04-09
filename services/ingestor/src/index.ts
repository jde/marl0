import express from 'express';
import { Kafka } from 'kafkajs';
import client from 'prom-client';
import { config } from './config';

// Setup Kafka producer
const kafka = new Kafka({ brokers: config.kafkaBrokers });
const producer = kafka.producer();

// Setup Prometheus metrics
const app = express();
const messagesProduced = new client.Counter({
  name: 'messages_produced_total',
  help: 'Total number of messages produced',
});

// Prometheus endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start HTTP server for Prometheus
app.listen(3000, () => {
  console.log('✅ Metrics server running at http://localhost:3000/metrics');
});

// === New: Create topic at startup ===
async function ensureTopicExists() {
  const admin = kafka.admin();
  await admin.connect();

  console.log('🔧 Ensuring Kafka topic exists...');

  await admin.createTopics({
    topics: [{
      topic: config.kafkaTopic,
      numPartitions: 1,
      replicationFactor: 1,
    }],
    waitForLeaders: true,
  });

  console.log(`✅ Kafka topic "${config.kafkaTopic}" is ready`);

  await admin.disconnect();
}

// === Message ingestion ===
async function run() {
  await ensureTopicExists();

  await producer.connect();
  console.log('🚀 Kafka producer connected');

  const messages = [
    {
      type: 'document',
      content: "For instance, on the planet Earth, man had always assumed that he was more intelligent than dolphins because he had achieved so much—the wheel, New York, wars and so on—whilst all the dolphins had ever done was muck about in the water having a good time. But conversely, the dolphins had always believed that they were far more intelligent than man—for precisely the same reasons.",
      source: "The Hitchhiker’s Guide to the Galaxy",
      author: "Douglas Adams",
    },
    {
      type: 'document',
      content: "Don't Panic.",
      source: "The Hitchhiker’s Guide to the Galaxy",
      author: "Douglas Adams",
    },
    {
      type: 'document',
      content: "Time is an illusion. Lunchtime doubly so.",
      source: "The Hitchhiker’s Guide to the Galaxy",
      author: "Douglas Adams",
    },
    {
      type: 'document',
      content: "Would it save you a lot of time if I just gave up and went mad now?",
      source: "The Hitchhiker’s Guide to the Galaxy",
      author: "Douglas Adams",
    },
    {
      type: 'document',
      content: "The Answer to the Great Question... Of Life, the Universe and Everything... Is... Forty-two.",
      source: "The Hitchhiker’s Guide to the Galaxy",
      author: "Douglas Adams",
    },
  ];

  for (const msg of messages) {
    await producer.send({
      topic: config.kafkaTopic,
      messages: [{ value: JSON.stringify(msg) }],
    });
    console.log(`📦 Sent message: "${msg.content.slice(0, 50)}..."`);
    messagesProduced.inc();
  }

  console.log('✅ All messages sent');
  await producer.disconnect();
}

run().catch((error) => {
  console.error('❌ Error in producer:', error);
  process.exit(1);
});
