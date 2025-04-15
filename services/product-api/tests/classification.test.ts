// services/product-api/test/classification.test.ts
import { getClassifications } from '@/services/read'
import { getClassificationDiffs, getConsensusLabels } from '@/services/utils'
import { ensureAgent, performActivity } from '@/services/write'
import { randomUUID } from 'crypto'

const agent = {
  id: `agent.classify.${randomUUID()}`,
  name: 'Classification Agent',
  version: '1.0.0',
  agentKind: 'automated' as const,
  agentMethod: 'test-classification',
}

describe('🏷️ Classification Utilities', () => {
  let baseId: string
  let revisedId: string

  beforeAll(async () => {
    await ensureAgent(agent)

    const base = await performActivity({
      agent,
      activity: {
        action: 'base-classify',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [],
      generatedEntities: [
        {
          payload: { concept: 'Mars atmosphere data v1' },
          classifications: [
            { name: 'planet', value: 'Mars', confidence: 1 },
            { name: 'dataset', value: 'v1', confidence: 0.9 },
            { name: 'source', value: 'nasa', confidence: 1 },
          ],
        },
      ],
    })
    baseId = base.entities[0].id

    const updated = await performActivity({
      agent,
      activity: {
        action: 'reclassify-version',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [baseId],
      generatedEntities: [
        {
          payload: { concept: 'Mars atmosphere data v2' },
          classifications: [
            { name: 'planet', value: 'Mars', confidence: 1 },
            { name: 'dataset', value: 'v2', confidence: 1 },
            { name: 'source', value: 'esa', confidence: 0.8 },
          ],
        },
      ],
    })
    revisedId = updated.entities[0].id
  })

  it('fetches all classifications for an entity', async () => {
    const classifications = await getClassifications(baseId)
    expect(classifications.length).toBeGreaterThan(0)
    const found = classifications.find((c) => c.name === 'planet')
    expect(found?.value).toBe('Mars')
  })

  it('evaluates consensus label correctly', async () => {
    const consensus = await getConsensusLabels(revisedId)
    expect(consensus.planet).toBe('Mars')
    expect(consensus.dataset).toBe('v2')
    expect(consensus.source).toBe('esa')
  })

  it('compares classification differences between versions', async () => {
    const diffs = await getClassificationDiffs(baseId, revisedId)
    const labels = diffs.map((d) => d.name)
    expect(labels).toContain('dataset')
    expect(labels).toContain('source')
    expect(labels).not.toContain('planet')
  })
})