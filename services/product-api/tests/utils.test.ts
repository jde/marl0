// services/product-api/test/utils.test.ts

import { getAncestry, getClassificationDiffs, getConsensusLabels, getForksFrom, getLatestVersionsOf } from '@/services/utils'
import { ensureAgent, performActivity } from '@/services/write'
import { randomUUID } from 'crypto'

const agent = {
  id: `agent.util.${randomUUID()}`,
  name: 'Util Tester',
  version: '0.1.0',
  agentKind: 'automated' as const,
  agentMethod: 'utils'
}

describe('🔎 Product Utils Test Suite', () => {
  let rootId: string
  let fork1Id: string
  let fork2Id: string
  let latestId: string

  beforeAll(async () => {
    await ensureAgent(agent)

    // 1. Create root entity
    const root = await performActivity({
      agent,
      activity: {
        action: 'initialize-tree',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [],
      generatedEntities: [
        {
          payload: { content: 'Genesis Entity' },
          classifications: [
            { name: 'role', value: 'root', confidence: 1, namespace: 'test' },
          ]
        }
      ]
    })
    rootId = root.entities[0].id

    // 2. Fork into two children
    const fork = await performActivity({
      agent,
      activity: {
        action: 'branch',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [rootId],
      generatedEntities: [
        {
          payload: { content: 'First Fork' },
          classifications: [
            { name: 'branch', value: 'alpha', confidence: 0.9 },
          ]
        },
        {
          payload: { content: 'Second Fork' },
          classifications: [
            { name: 'branch', value: 'beta', confidence: 1 },
          ]
        }
      ]
    })
    fork1Id = fork.entities[0].id
    fork2Id = fork.entities[1].id

    // 3. Extend first fork to create a terminal entity
    const leaf = await performActivity({
      agent,
      activity: {
        action: 'extend',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [fork1Id],
      generatedEntities: [
        {
          payload: { content: 'Final Version' },
          classifications: [
            { name: 'stage', value: 'final' }
          ]
        }
      ]
    })
    latestId = leaf.entities[0].id
  })

  it('traces full ancestry lineage', async () => {
    const ancestry = await getAncestry(latestId, 5)
    expect(ancestry).toContain(rootId)
    expect(ancestry).toContain(fork1Id)
    expect(ancestry).toContain(latestId)
    expect(ancestry).not.toContain(fork2Id)
  })

  it('derives classification consensus', async () => {
    const consensus = await getConsensusLabels(fork2Id)
    expect(consensus.branch).toBe('beta')
  })

  it('detects classification diffs between forks', async () => {
    const diffs = await getClassificationDiffs(fork1Id, fork2Id)
    expect(diffs.find((d) => d.name === 'branch')).toBeDefined()
  })

  it('resolves all forks from root', async () => {
    const forks = await getForksFrom(rootId)
    const ids = forks.map((f) => f.id)
    expect(ids).toContain(fork1Id)
    expect(ids).toContain(fork2Id)
  })

  it('finds latest descendants', async () => {
    const latest = await getLatestVersionsOf(rootId)
    expect(latest).toContain(latestId)
    expect(latest).toContain(fork2Id) // fork2 is terminal — not used again
  })
})
