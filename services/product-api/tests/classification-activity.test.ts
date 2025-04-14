// services/product-api/test/classification-activity.test.ts

import { db } from '@/lib/prisma'
import { getClassifications } from '@/services/read'
import { ensureAgent, performActivity } from '@/services/write'
import { randomUUID } from 'crypto'

const agent = {
  id: `agent.classify.${randomUUID()}`,
  name: 'Standalone Classifier',
  version: '1.0.0',
  agentKind: 'automated' as const,
  agentMethod: 'classification-only'
}

describe('🧠 Classification-Only Activity Tests', () => {
  let targetEntityId: string
  let classificationActivityId: string

  beforeAll(async () => {
    await ensureAgent(agent)

    // Step 1: Create an entity to classify
    const base = await performActivity({
      agent,
      activity: {
        action: 'create-base',
        timestamp: new Date().toISOString(),
      },
      usedEntityIds: [],
      generatedEntities: [
        {
          payload: { content: 'Unlabeled data point' },
        },
      ],
    })
    targetEntityId = base.entities[0].id

    // Step 2: Perform a classification-only activity
    const activity = await db.activity.create({
      data: {
        action: 'label-existing',
        timestamp: new Date().toISOString(),
        agent: { connect: { id: agent.id } },
        used: { create: [{ entityId: targetEntityId }] },
        generated: { create: [] },
      },
    })
    classificationActivityId = activity.id

    // Step 3: Create the classification linked to this activity
    await db.classification.create({
      data: {
        entityId: targetEntityId,
        agentId: agent.id,
        activityId: classificationActivityId,
        name: 'truth',
        value: 'satirical',
        confidence: 0.7,
        namespace: 'annotated',
      },
    })
  })

  it('creates a classification-only activity with no generated entities', async () => {
    const activity = await db.activity.findUnique({
      where: { id: classificationActivityId },
      include: { used: true, generated: true },
    })
    expect(activity).toBeDefined()
    expect(activity?.used.length).toBe(1)
    expect(activity?.generated.length).toBe(0)
  })

  it('stores classification linked to both entity and activity', async () => {
    const classifications = await getClassifications(targetEntityId)
    const found = classifications.find(c => c.activityId === classificationActivityId)
    expect(found).toBeDefined()
    expect(found?.name).toBe('truth')
    expect(found?.value).toBe('satirical')
  })
})
