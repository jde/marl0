// services/product/write.ts

import { db } from '@/lib/prisma'
import { ActorContext, CreateEntitiesArgs, CreateEntitiesResult, UpsertClassificationArgs } from '@/services/types'
import { Prisma } from '@prisma/client'
// Ensure the actor exists in the database or create it if missing
export async function ensureActor(actor: ActorContext) {
  return db.actor.upsert({
    where: { id: actor.id },
    update: {},
    create: {
      id: actor.id,
      name: actor.name,
      version: actor.version,
      actorKind: actor.actorKind,
      actorMethod: actor.actorMethod,
    },
  })
}

// Create entities, their provenance, and any classifications (atomically)
export async function createEntities(
  actor: ActorContext,
  entitiesData: CreateEntitiesArgs['entities']
): Promise<CreateEntitiesResult> {
  return db.$transaction(async (tx) => {
    const entityRecords = []
    const edgeRecords = []

    for (const entity of entitiesData) {
      const newEntity = await tx.entity.create({
        data: {
          payload: entity.payload,
          createdById: actor.id,
        },
      })
      entityRecords.push(newEntity)

      if (entity.provenance) {
        const edge = await tx.provenanceEdge.create({
          data: {
            actorId: actor.id,
            timestamp: entity.provenance.timestamp,
            action: entity.provenance.action,
            parameters: entity.provenance.parameters,
            inputs: {
              create: entity.provenance.inputEntityIds.map((entityId) => ({ entityId })),
            },
            outputs: {
              create: [{ entityId: newEntity.id }],
            },
          },
        })
        edgeRecords.push(edge)
      }

      if (entity.classifications?.length) {
        for (const classification of entity.classifications) {
          await upsertClassification(tx, {
          actor,
          entityId: newEntity.id,
          name: classification.name,
          value: classification.value,
          confidence: classification.confidence,
          namespace: classification.namespace,
          taxonomyVersionId: classification.taxonomyVersionId,
          overrideId: classification.overrideId,
        })

        }
      }
    }

    return { entities: entityRecords, provenanceEdges: edgeRecords }
  })
}

// Insert or update a classification for a given entity

export async function upsertClassification(
  tx: Prisma.TransactionClient,
  args: UpsertClassificationArgs
) {
  const {
    actor,
    entityId,
    name,
    value,
    confidence,
    namespace,
    taxonomyVersionId,
    overrideId,
  } = args

  return tx.classification.upsert({
    where: {
      entityId_name: {
        entityId,
        name,
      },
    },
    update: {
      value,
      confidence,
      namespace,
      taxonomyVersionId,
      supersedesId: overrideId ?? undefined,
      actorId: actor.id,
    },
    create: {
      entityId,
      name,
      value,
      confidence,
      namespace,
      taxonomyVersionId,
      supersedesId: overrideId ?? undefined,
      actorId: actor.id,
    },
  })
}
