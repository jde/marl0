// services/product/read.ts

import { db } from '@/lib/prisma'
import type { ProvenanceEdge } from '@prisma/client'

export async function getEntityById(id: string) {
  return db.entity.findUnique({
    where: { id },
    include: {
      classifications: true,
      inputTo: true,
      outputFrom: true,
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
    orderBy: { timestamp: 'desc' },
  })
}

export async function getProvenance(entityId: string, depth: number = 1): Promise<ProvenanceEdge[]> {
  const provenanceEdges = await db.provenanceEdge.findMany({
    where: {
      outputs: {
        some: {
          entityId,
        },
      },
    },
    include: {
      inputs: true,
      outputs: true,
    },
  })

  if (depth <= 1) return provenanceEdges

  const parentEdges: ProvenanceEdge[][] = await Promise.all(
    provenanceEdges.flatMap((edge) =>
      edge.inputs.map((input) => getProvenance(input.entityId, depth - 1))
    )
  )

  return [...provenanceEdges, ...parentEdges.flat()]
}

export async function getProvenanceTimeline(entityId: string, depth: number = 1) {
  const seen = new Set<string>()
  const result: any[] = []

  async function walk(id: string, d: number) {
    if (seen.has(id) || d > depth) return
    seen.add(id)

    const entity = await db.entity.findUnique({ where: { id } })
    if (entity) result.push(entity)

    const edge = await db.provenanceEdge.findFirst({
      where: {
        outputs: {
          some: { entityId: id },
        },
      },
      include: { inputs: true },
    })

    if (!edge) return

    for (const input of edge.inputs) {
      await walk(input.entityId, d + 1)
    }
  }

  await walk(entityId, 0)
  return result
}

export async function getSiblings(entityId: string) {
  const edge = await db.provenanceEdge.findFirst({
    where: {
      outputs: {
        some: { entityId },
      },
    },
    include: {
      outputs: {
        include: {
          entity: true,
        },
      },
    },
  })

  if (!edge) return []

  return edge.outputs.map((o) => o.entity).filter((entity) => entity.id !== entityId)
}

export async function getActorById(actorId: string) {
  return db.actor.findUnique({
    where: { id: actorId },
  })
}