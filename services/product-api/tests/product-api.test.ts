// services/product-api/test/product-api.test.ts

import { getClassifications, getEntityById, getProvenance } from '@/services/read'
import { getConsensusLabels } from '@/services/utils'
import { ensureAgent, performActivity } from '@/services/write'
import { randomUUID } from 'crypto'

const agent = {
  id: `agent.test.${randomUUID()}`,
  name: 'Test Agent',
  version: '1.0.0',
  agentKind: 'automated' as const,
  agentMethod: 'test-runner',
}

describe('🧪 Product API E2E Test Suite', () => {
  let entityId: string

  it('creates entity with provenance and classification', async () => {
    await ensureAgent(agent)
    
    const { entities } = await performActivity({
      agent,
      activity: {
        action: 'ingest-fact',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [],
      generatedEntities: [
        {
          payload: { content: 'Water freezes at 0°C' },
          classifications: [
            {
              name: 'domain',
              value: 'physics',
              confidence: 1,
              namespace: 'test-suite',
            },
          ],
        },
      ],
    })

    expect(entities.length).toBe(1)
    entityId = entities[0].id
  })

  it('retrieves the created entity', async () => {
    const entity = await getEntityById(entityId)
    expect(entity).toBeDefined()
    expect(entity?.id).toBe(entityId)
    expect((entity?.payload as { content: string }).content).toBe('Water freezes at 0°C')
  })

  it('retrieves classifications for the entity', async () => {
    const classifications = await getClassifications(entityId)
    expect(classifications.length).toBeGreaterThan(0)
    expect(classifications[0].name).toBe('domain')
    expect(classifications[0].value).toBe('physics')
  })

  it('retrieves the provenance activity', async () => {
    const provenance = await getProvenance(entityId)
    expect(provenance.length).toBeGreaterThan(0)
    const match = provenance.find((p: any) => p.action === 'ingest-fact')
    expect(match).toBeDefined()
  })

  it('retrieves classification consensus', async () => {
    const consensus = await getConsensusLabels(entityId)
    expect(consensus.domain).toBe('physics')
  })
})
