import { startMetricsServer } from './metrics';
import { produceMessage, startProducer } from './producer';
import { quotes } from './quotes';

async function main() {
  startMetricsServer();
  await startProducer();

  for (const quote of quotes) {
    await produceMessage({
      type: 'document',
      ...quote
    });

    console.log(`📦 Sent message: "${quote.content.substring(0, 50)}..."`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay for visibility
  }

  console.log('✅ All messages sent');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
