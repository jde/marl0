import { db } from '@/lib/prisma'

export async function getEntityById(entityId: string) {
  const entity = await db.entity.findUniqueOrThrow({
    where: { id: entityId },
    include: {
      classifications: true,
      outputFrom: {
        include: {
          activity: {
            include: {
              agent: true
            }
          },
        },
      },    
      inputTo: {include: {activity: true} },
      createdBy: true,
    },
  })

  return {
    entity: {
      id: entity.id,
      payload: entity.payload,
      createdAt: entity.createdAt,
      createdById: entity.createdById,
      outputFrom: entity.outputFrom[0]?.activity,
      classifications: entity.classifications.map((c) => ({
        id: c.id,
        name: c.name,
        value: c.value,
        confidence: c.confidence,
        namespace: c.namespace,

        activityId: c.activityId,
        supersedesId: c.supersedesId,
        agentId: c.agentId,

        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt,
      })),
    },
  }
}
