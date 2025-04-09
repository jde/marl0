import { Kafka } from 'kafkajs';
import { config } from './config';
import { extractEntities } from './extractor';
import { extractionFailures, messagesConsumed } from './metrics';
import { saveToLanceDB, saveToPostgres } from './persistence';

const kafka = new Kafka({ brokers: config.kafkaBrokers });
const consumer = kafka.consumer({ groupId: 'entity-extractor-group-2' });

type ParsedMessage = {
    type: string;
    content: string;
    source: string;
    author: string;
};

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


        const parsed: ParsedMessage = JSON.parse(value);

        const entities = await extractEntities(parsed.content);

        // Update here 👇
        await saveToPostgres(entities, parsed.source, parsed.author);
        await saveToLanceDB(entities);


      } catch (error) {
        console.error('❌ Error processing message:', error);
        extractionFailures.inc();
      }
    },
  });
}
