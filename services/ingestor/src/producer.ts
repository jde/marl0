import { Kafka, logLevel } from 'kafkajs';
import { config } from './config';
import { messagesErrored, messagesProduced } from './metrics';

const kafka = new Kafka({
  brokers: config.kafkaBrokers,
  logLevel: logLevel.INFO,
  logCreator: () => (entry) => {
    console.log(`[KafkaJS] ${entry.log.message}`);
  },
});

const producer = kafka.producer();

async function waitForKafkaConnection(retries = 10, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await producer.connect();
      console.log('🚀 Kafka producer connected');
      return;
    } catch (error) {
      console.error(`🕒 Kafka connection failed (attempt ${attempt} of ${retries}). Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.error('❌ Kafka connection failed after maximum retries.');
  process.exit(1);
}

export async function startProducer() {
  await waitForKafkaConnection();
}

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
