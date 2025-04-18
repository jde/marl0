// services/product/write.ts
import { sendToFirehose } from '@/lib/firehose'
import { db } from '@/lib/prisma'
import { AgentContext, PerformActivityArgs } from '@/services/types'
import { v4 as uuidv4 } from 'uuid'

export async function ensureAgent(agent: AgentContext) {
  return db.agent.upsert({
    where: { id: agent.id },
    update: {
      name: agent.name,
      version: agent.version,
      agentKind: agent.agentKind,
      agentMethod: agent.agentMethod,
    },
    create: {
      id: agent.id,
      name: agent.name,
      version: agent.version,
      agentKind: agent.agentKind,
      agentMethod: agent.agentMethod,
    },
  })
}

export async function performActivity({
  agent,
  activity,
  usedEntityIds,
  generatedEntities = [],
  classifications = [],
}: PerformActivityArgs & {
  classifications?: {
    entityId: string
    name: string
    value: string
    confidence?: number
    namespace?: string
    supersedesId?: string
  }[]
}) {


  return db.$transaction(async (tx) => {
    const createdEntities = await Promise.all(
      generatedEntities.map(async (entry) => {
        const id = uuidv4() 

        await tx.entity.create({
          data: {
            id, 
            payload: entry.payload,
            createdById: agent.id,
          },
        })

        if (entry.classifications?.length) {
          await tx.classification.createMany({
            data: entry.classifications.map((c) => ({
              entityId: id, 
              agentId: agent.id,
              name: c.name,
              value: c.value,
              confidence: c.confidence,
              namespace: c.namespace,
            })),
          })
        }

        return tx.entity.findUnique({ where: { id } }) // return full entity if needed
      })
    )


    const activityRecord = await tx.activity.create({
      data: {
        action: activity.action,
        timestamp: activity.timestamp,
        agent: { connect: { id: agent.id } },
        used: { create: usedEntityIds.map((id) => ({ entityId: id })) },
        generated: { create: createdEntities.map((e) => ({ entityId: e.id })) },
      },
    })

    if (classifications && classifications.length > 0) {
      for (const c of classifications) {
        await tx.classification.create({
          data: {
            entityId: c.entityId,
            agentId: agent.id,
            activityId: activityRecord.id,
            name: c.name,
            value: c.value,
            confidence: c.confidence,
            namespace: c.namespace,
            supersedesId: c.supersedesId,
          },
        })
      }
    }

    return {
      activity: activityRecord,
      entities: createdEntities,
    }
  })
}

export async function performActivityWithFirehose(
  args: PerformActivityArgs & {
    classifications?: {
      entityId: string
      name: string
      value: string
      confidence?: number
      namespace?: string
      supersedesId?: string
    }[]
  }
) {
  const result = await performActivity(args)
  const now = new Date().toISOString()

  await Promise.all(
    result.entities.map((entity) =>
      sendToFirehose({
        event_type: 'entity.created',
        entity_id: entity.id,
        activity_id: result.activity.id,
        agent: args.agent.id,
        agent_version: args.agent.version,
        kind: args.activity.action,
        timestamp: now,
      })
    )
  )

    const classificationEvents = args.classifications?.map((c) => ({
      event_type: 'classification.added' as const,
      entity_id: c.entityId,
      entity_type: 'Unknown',
      activity_id: result.activity.id,
      agent: args.agent.id,
      agent_version: args.agent.version,
      kind: args.activity.action,
      classification_key: c.name,
      classification_value: c.value,
      timestamp: now,
    })) ?? []

  await Promise.all(classificationEvents.map(sendToFirehose))

  return result
}
