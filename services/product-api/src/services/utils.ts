// services/product/utils.ts

import { db } from '@/lib/prisma'

export async function getAncestry(itemId: string, depth: number = 3): Promise<string[]> {
  const seen = new Set<string>()
  const result: string[] = []

  async function walk(id: string, d: number) {
    if (seen.has(id) || d > depth) return
    seen.add(id)
    result.push(id)

    const edge = await db.provenanceEdge.findFirst({
      where: {
        outputs: { some: { itemId: id } },
      },
      include: {
        inputs: true,
      },
    })

    if (!edge) return

    for (const input of edge.inputs) {
      await walk(input.itemId, d + 1)
    }
  }

  await walk(itemId, 0)
  return result
}

export async function getConsensusLabels(itemId: string): Promise<Record<string, string>> {
  const classifications = await db.classification.findMany({
    where: { itemId },
  })

  const map: Record<string, Record<string, number>> = {}

  for (const cls of classifications) {
    if (!map[cls.name]) map[cls.name] = {}
    map[cls.name][cls.value] = (map[cls.name][cls.value] || 0) + (cls.confidence ?? 1)
  }

  const consensus: Record<string, string> = {}
  for (const name of Object.keys(map)) {
    const values = Object.entries(map[name])
    values.sort((a, b) => b[1] - a[1])
    consensus[name] = values[0][0]
  }

  return consensus
}

export async function getClassificationDiffs(itemA: string, itemB: string) {
  const [a, b] = await Promise.all([
    db.classification.findMany({ where: { itemId: itemA } }),
    db.classification.findMany({ where: { itemId: itemB } }),
  ])

  const result = []
  const aMap = new Map(a.map((c) => [c.name, c.value]))
  const bMap = new Map(b.map((c) => [c.name, c.value]))

  const allKeys = new Set([...aMap.keys(), ...bMap.keys()])

  for (const key of allKeys) {
    const va = aMap.get(key)
    const vb = bMap.get(key)
    if (va !== vb) {
      result.push({ name: key, a: va, b: vb })
    }
  }

  return result
}

export async function getForksFrom(itemId: string) {
  const edge = await db.provenanceEdge.findFirst({
    where: {
      inputs: {
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

  return edge.outputs.map((o) => o.item)
}

export async function getLatestVersionsOf(itemId: string): Promise<string[]> {
  const seen = new Set<string>()
  const children: string[] = []

  async function walk(id: string) {
    if (seen.has(id)) return
    seen.add(id)

    const edge = await db.provenanceEdge.findFirst({
      where: {
        inputs: { some: { itemId: id } },
      },
      include: {
        outputs: true,
      },
    })

    if (!edge || edge.outputs.length === 0) {
      children.push(id)
      return
    }

    for (const out of edge.outputs) {
      await walk(out.itemId)
    }
  }

  await walk(itemId)
  return children
}
