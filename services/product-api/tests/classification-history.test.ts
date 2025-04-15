// services/product-api/test/classification-history.test.ts

import { getClassificationHistory, getCurrentClassifications } from '@/services/classification'
import { ensureAgent, performActivity } from '@/services/write'
import { randomUUID } from 'crypto'

const trusted = {
  id: `agent.trusted.${randomUUID()}`,
  name: 'Trusted Classifier',
  version: '1.0.0',
  agentKind: 'automated' as const,
  agentMethod: 'trust-labels'
}

const rival = {
  id: `agent.rival.${randomUUID()}`,
  name: 'Untrusted Classifier',
  version: '1.0.0',
  agentKind: 'automated' as const,
  agentMethod: 'rival-method'
}

describe('📚 Classification History + Mutability', () => {
  let entityId: string
  let activityId: string
  let originalClassificationId: string

  beforeAll(async () => {
    await Promise.all([ensureAgent(trusted), ensureAgent(rival)])

    // Create an entity with one label
    const res = await performActivity({
      agent: trusted,
      activity: {
        action: 'init-entity',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [],
      generatedEntities: [
        {
          payload: { content: 'Labeled Image' },
          classifications: [
            { name: 'type', value: 'landscape', confidence: 1 },
          ],
        },
      ]
    })
    entityId = res.entities[0].id

    // Retrieve the original classification ID
    const prior = await getClassificationHistory(entityId)
    originalClassificationId = prior.find((c) => c.name === 'type' && c.value === 'landscape')?.id || ''

    // Perform classification override activity
    const override = await performActivity({
      agent: trusted,
      activity: {
        action: 'refine-label',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [entityId],
      generatedEntities: [],
      classifications: [
        {
          entityId,
          name: 'type',
          value: 'mountain',
          confidence: 0.95,
          namespace: 'trust',
          supersedesId: originalClassificationId
        }
      ]
    })
    activityId = override.activity.id

    // Rival agent asserts an alternate value
    await performActivity({
      agent: rival,
      activity: {
        action: 'contest-label',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [entityId],
      generatedEntities: [],
      classifications: [
        {
          entityId,
          name: 'type',
          value: 'portrait',
          confidence: 0.6,
          namespace: 'rivalry',
        }
      ]
    })
  })

  it('returns full classification history', async () => {
    const history = await getClassificationHistory(entityId)
    expect(history.length).toBeGreaterThanOrEqual(2)
    expect(history.some((c) => c.name === 'type')).toBe(true)
  })

  it('returns only latest classification by default', async () => {
    const current = await getCurrentClassifications(entityId)
    expect(current.length).toBe(1)
    expect(current[0].value).toMatch(/mountain|portrait/)
  })

  it('filters by trusted agent only', async () => {
    const current = await getCurrentClassifications(entityId, { trustedAgents: [trusted.id] })
    expect(current.length).toBe(1)
    expect(current[0].agentId).toBe(trusted.id)
  })

  it('excludes rival classification from view', async () => {
    const current = await getCurrentClassifications(entityId, { excludedAgents: [rival.id] })
    expect(current.length).toBe(1)
    expect(current[0].agentId).toBe(trusted.id)
  })

  it('includes deleted if requested (none deleted in this test)', async () => {
    const all = await getClassificationHistory(entityId, { includeDeleted: true })
    expect(all.length).toBeGreaterThan(0)
  })
})
