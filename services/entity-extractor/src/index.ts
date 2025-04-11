import { startConsumer } from './consumer';
import './metrics';

async function main() {
  try {
    await startConsumer();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
