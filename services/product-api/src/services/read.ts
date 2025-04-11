// services/product/read.ts

import { db } from '@/lib/prisma'
import type { ProvenanceEdge } from '@prisma/client'

export async function getItemById(id: string) {
  return db.item.findUnique({
    where: { id },
    include: {
      classifications: true,
      inputTo: true,
      outputFrom: true,
    },
  })
}

export async function getItemsByLabel(name: string, value: string) {
  return db.item.findMany({
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

export async function getClassifications(itemId: string) {
  return db.classification.findMany({
    where: { itemId },
  })
}

export async function getClassificationHistory(itemId: string, name?: string) {
  return db.classification.findMany({
    where: {
      itemId,
      ...(name && { name }),
    },
    orderBy: { timestamp: 'desc' },
  })
}

export async function getProvenance(itemId: string, depth: number = 1): Promise<ProvenanceEdge[]> {
  const provenanceEdges = await db.provenanceEdge.findMany({
    where: {
      outputs: {
        some: {
          itemId,
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
      edge.inputs.map((input) => getProvenance(input.itemId, depth - 1))
    )
  )

  return [...provenanceEdges, ...parentEdges.flat()]
}

export async function getProvenanceTimeline(itemId: string, depth: number = 1) {
  const seen = new Set<string>()
  const result: any[] = []

  async function walk(id: string, d: number) {
    if (seen.has(id) || d > depth) return
    seen.add(id)

    const item = await db.item.findUnique({ where: { id } })
    if (item) result.push(item)

    const edge = await db.provenanceEdge.findFirst({
      where: {
        outputs: {
          some: { itemId: id },
        },
      },
      include: { inputs: true },
    })

    if (!edge) return

    for (const input of edge.inputs) {
      await walk(input.itemId, d + 1)
    }
  }

  await walk(itemId, 0)
  return result
}

export async function getSiblings(itemId: string) {
  const edge = await db.provenanceEdge.findFirst({
    where: {
      outputs: {
        some: { itemId },
      },
    },
    include: {
      outputs: {
        include: {
          item: true,
        },
      },
    },
  })

  if (!edge) return []

  return edge.outputs.map((o) => o.item).filter((item) => item.id !== itemId)
}

export async function getActorById(actorId: string) {
  return db.actor.findUnique({
    where: { id: actorId },
  })
}