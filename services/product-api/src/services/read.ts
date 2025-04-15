// services/product/read.ts

import { db } from '@/lib/prisma'
import type { Activity, Entity, ProvenanceInput, ProvenanceOutput } from '@prisma/client'

type ActivityWithRelations = Activity & {
  used: ProvenanceInput[]
  generated: ProvenanceOutput[]
  agent: {
    id: string
    name: string
  }
}

export async function getEntityById(entityId: string) {
  return db.entity.findUnique({
    where: { id: entityId },
    include: {
      classifications: true,
      createdBy: true,
    },
  })
}

export async function getEntitiesByLabel(name: string, value: string) {
  return db.entity.findMany({
    where: {
      classifications: {
        some: {
          name,
          value,
        },
      },
    },
  })
}

export async function getClassifications(entityId: string) {
  return db.classification.findMany({
    where: { entityId },
  })
}

export async function getClassificationHistory(entityId: string, name?: string) {
  return db.classification.findMany({
    where: {
      entityId,
      ...(name && { name }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProvenance(entityId: string, depth: number = 1): Promise<ActivityWithRelations[]> {
  const activities = await db.activity.findMany({
    where: {
      OR: [
        { generated: { some: { entityId } } },
        { used: { some: { entityId } } },
      ],
    },
    include: {
      used: true,
      generated: true,
      agent: true,
    },
  }) as ActivityWithRelations[]

  if (depth <= 1) return activities

  const parentActivities: ActivityWithRelations[][] = await Promise.all(
    activities.flatMap((activity) =>
      activity.used.map((input) => getProvenance(input.entityId, depth - 1))
    )
  )

  return [...activities, ...parentActivities.flat()]
}

export async function getProvenanceTimeline(entityId: string, depth: number = 1) {
  const seen = new Set<string>()
  const result: Entity[] = []

  async function walk(id: string, d: number) {
    if (seen.has(id) || d > depth) return
    seen.add(id)

    const entity = await db.entity.findUnique({ where: { id } })
    if (entity) result.push(entity)

    const activity = await db.activity.findFirst({
      where: {
        generated: {
          some: { entityId: id },
        },
      },
      include: { used: true },
    })

    if (!activity) return

    for (const input of activity.used) {
      await walk(input.entityId, d + 1)
    }
  }

  await walk(entityId, 0)
  return result
}

export async function getSiblings(entityId: string) {
  const activity = await db.activity.findFirst({
    where: {
      generated: {
        some: { entityId },
      },
    },
    include: {
      generated: {
        include: {
          entity: true,
        },
      },
    },
  })

  if (!activity) return []

  return activity.generated.map((o) => o.entity).filter((entity) => entity.id !== entityId)
}

export async function getAgentById(agentId: string) {
  return db.agent.findUnique({
    where: { id: agentId },
  })
}

export async function getClassificationById(classificationId: string) {
  return db.classification.findUnique({
    where: { id: classificationId },
    include: {
      entity: true,
      agent: true,
    },
  })
}

export async function getActivityById(activityId: string) {
  return db.activity.findUnique({
    where: { id: activityId },
    include: {
      used: true,
      generated: true,
      agent: true,
    },
  })
}

export async function getActivityByEntityId(entityId: string) {
  return db.activity.findFirst({
    where: {
      generated: {
        some: { entityId },
      },
    },
    include: {
      used: true,
      generated: true,
      agent: true,
    },
  })
}