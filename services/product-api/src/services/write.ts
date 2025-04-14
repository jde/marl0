// services/product/write.ts

import { db } from '@/lib/prisma'
import { AgentContext, PerformActivityArgs } from '@/services/types'

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
  generatedEntities,
}: PerformActivityArgs) {
  return db.$transaction(async (tx) => {
    // Create the new entities
    const createdEntities = await Promise.all(
      generatedEntities.map(async (entry) => {
        const created = await tx.entity.create({
          data: {
            payload: entry.payload,
            createdById: agent.id,
          },
        })

        if (entry.classifications?.length) {
          await tx.classification.createMany({
            data: entry.classifications.map((c) => ({
              entityId: created.id,
              agentId: agent.id,
              name: c.name,
              value: c.value,
              confidence: c.confidence,
              namespace: c.namespace,
            })),
          })
        }

        return created
      })
    )

    // Create the activity and link everything
    const activityRecord = await tx.activity.create({
      data: {
        action: activity.action,
        timestamp: activity.timestamp,
        agent: { connect: { id: agent.id } },
        used: { create: usedEntityIds.map((id) => ({ entityId: id })) },
        generated: { create: createdEntities.map((e) => ({ entityId: e.id })) },
      },
    })

    return {
      activity: activityRecord,
      entities: createdEntities,
    }
  })
}