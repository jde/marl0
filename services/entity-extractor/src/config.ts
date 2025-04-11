export const config = {
  kafkaBrokers: ['kafka:9092'],
  kafkaTopic: 'ingestor.hhgg',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  postgresConnectionString: process.env.POSTGRES_CONNECTION_STRING || '',
  lanceDbPath: process.env.LANCEDB_PATH || '/data',
};
