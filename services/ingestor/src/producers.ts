import { Kafka } from 'kafkajs';
import { config } from './config';
import { messagesErrored, messagesProduced } from './metrics';

const kafka = new Kafka({ brokers: config.kafkaBrokers });
const producer = kafka.producer();

export async function produceMessage(message: object) {
  try {
    await producer.send({
      topic: config.kafkaTopic,
      messages: [{ value: JSON.stringify(message) }],
    });
    messagesProduced.inc();
  } catch (error) {
    console.error('❌ Error producing message:', error);
    messagesErrored.inc();
  }
}

export async function startProducer() {
  await producer.connect();
  console.log('🚀 Kafka producer connected');
}
