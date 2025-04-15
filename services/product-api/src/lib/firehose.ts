import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'product-api',
  brokers: (process.env.KAFKA_BROKERS ?? 'kafka:9092').split(','),
})

const producer = kafka.producer()
let connected = false

export async function sendToFirehose(event: {
  event_type: 'entity.created' | 'classification.added'
  entity_id: string
  entity_type: string
  activity_id: string
  agent: string
  agent_version: string
  kind: string
  classification_key?: string
  classification_value?: string
  timestamp?: string
}) {
  if (!connected) {
    await producer.connect()
    connected = true
  }

  const payload = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  }

  await producer.send({
    topic: 'marl0.firehose',
    messages: [{ value: JSON.stringify(payload) }],
  })
}
