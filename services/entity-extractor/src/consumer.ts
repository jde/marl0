import { Kafka } from 'kafkajs';
import { config } from './config';
import { runLocalLLM } from './llm'; // ✅ Use local LLM
import { extractionFailures, llmFailures, llmRequests, messageProcessingDuration, messagesConsumed } from './metrics';

const kafka = new Kafka({ brokers: config.kafkaBrokers });
const consumer = kafka.consumer({ groupId: 'entity-extractor-group-' + Date.now() });

export async function startConsumer() {
  await consumer.connect();
  console.log('🚀 Kafka consumer connected');

  await consumer.subscribe({ topic: config.kafkaTopic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {

       const endTimer = messageProcessingDuration.startTimer();

      const value = message.value?.toString();
      if (!value) return;

      console.log(`📥 Consumed message: ${value}`);
      messagesConsumed.inc();

      try {
        const parsed = JSON.parse(value);
        const prompt = `
You are an entity extraction engine. 

Extract all named entities from the following content and return them in clean, minified JSON array format. 

Respond **only** with the JSON array, with no explanations, no prose. The result should be valid JSON without any additional text or formatting.

Example format: [{ name: "entity1", type: "person" }, { name: "entity2", type: "organization" }]

Content:
${parsed.content}
        `.trim();
        
        llmRequests.inc();
        const response = await runLocalLLM(prompt);

        let entities: string[] = [];
        try {
          entities = JSON.parse(response);
        } catch (jsonError) {
          console.error('❌ Failed to parse LLM response as JSON:', response.slice(0, 100));
          extractionFailures.inc();
          llmFailures.inc();
          return;
        }

        console.log('🔍 Extracted Entities:', entities);

        entities.forEach(entity => {
          console.log(`➡️ Entity: ${entity}`);
        });

      } catch (error) {
        console.error('❌ Error processing message:', error);
        extractionFailures.inc();
      } finally {
        endTimer();
      }
    },
  });
}
