// services/product/write.ts

import { db } from '@/lib/prisma'
import { ActorContext, CreateItemsArgs, CreateItemsResult, UpsertClassificationArgs } from '@/services/types'

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

// Create items, their provenance, and any classifications (atomically)
export async function createItems(
  actor: ActorContext,
  itemsData: CreateItemsArgs['items']
): Promise<CreateItemsResult> {
  return db.$transaction(async (tx) => {
    const itemRecords = []
    const edgeRecords = []

    for (const item of itemsData) {
      const newItem = await tx.item.create({
        data: {
          payload: item.payload,
          createdById: actor.id,
        },
      })
      itemRecords.push(newItem)

      if (item.provenance) {
        const edge = await tx.provenanceEdge.create({
          data: {
            actorId: actor.id,
            timestamp: item.provenance.timestamp,
            action: item.provenance.action,
            parameters: item.provenance.parameters,
            inputs: {
              create: item.provenance.inputItemIds.map((itemId) => ({ itemId })),
            },
            outputs: {
              create: [{ itemId: newItem.id }],
            },
          },
        })
        edgeRecords.push(edge)
      }

      if (item.classifications?.length) {
        for (const classification of item.classifications) {
          await upsertClassification({
            actor,
            itemId: newItem.id,
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

    return { items: itemRecords, provenanceEdges: edgeRecords }
  })
}

// Insert or update a classification for a given item
export async function upsertClassification(args: UpsertClassificationArgs) {
  const {
    actor,
    itemId,
    name,
    value,
    confidence,
    namespace,
    taxonomyVersionId,
    overrideId,
  } = args

  return db.classification.upsert({
    where: {
      itemId_name: {
        itemId,
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
      itemId,
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
