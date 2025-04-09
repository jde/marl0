import { PrismaClient } from '@prisma/client';
import { postgresInserts } from './metrics';

// Initialize Prisma client
const prisma = new PrismaClient();

export async function saveToPostgres(entities: string[], source: string, author: string) {
  try {
    const data = entities.map(entity => ({
      value: entity,
      source,
      author,
    }));

    await prisma.entity.createMany({ data });
    postgresInserts.inc(entities.length);
    console.log(`💾 Saved to Postgres via Prisma: ${entities.length} entities`);
  } catch (error) {
    console.error('❌ Prisma insert error:', error);
  }
}

export async function saveToLanceDB(entities: any[]): Promise<void> {
  console.log('💾 Saving entities to LanceDB:', entities);
  // TODO: Wire LanceDB client
}
