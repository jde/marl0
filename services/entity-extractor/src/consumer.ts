import { Kafka } from 'kafkajs';
import { config } from './config';
import { extractEntities } from './extractor';
import { extractionFailures, messagesConsumed } from './metrics';
import { saveToLanceDB, saveToPostgres } from './persistence';

const kafka = new Kafka({ brokers: config.kafkaBrokers });
const consumer = kafka.consumer({ groupId: 'entity-extractor-group-1' });

export async function startConsumer() {
  await consumer.connect();
  console.log('🚀 Kafka consumer connected');

  await consumer.subscribe({ topic: config.kafkaTopic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value?.toString();
      if (!value) return;

      console.log(`📥 Consumed message: ${value}`);

      messagesConsumed.inc();

      try {
        const parsed = JSON.parse(value);
        const entities = await extractEntities(parsed.content);

        await saveToPostgres(entities);
        await saveToLanceDB(entities);

      } catch (error) {
        console.error('❌ Error processing message:', error);
        extractionFailures.inc();
      }
    },
  });
}
