// services/product-api/test/deep-provenance.test.ts

import { randomUUID } from 'crypto'
import request from 'supertest'

const BASE_URL = 'http://localhost:3001'
const agent = {
  id: `agent.deep.${randomUUID()}`,
  name: 'Deep Provenance Agent',
  version: '1.0.0',
  agentKind: 'automated',
}

let rootId: string
let child1Id: string
let child2Id: string
let grandchildId: string

describe('🌲 Deep Provenance Tree Tests (via performActivity)', () => {
  it('creates a root entity via activity', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/perform/activity')
      .send({
        agent,
        activity: {
          action: 'initialize-knowledge-root',
          timestamp: new Date().toISOString(),
        },
        usedEntityIds: [],
        generatedEntities: [
          {
            payload: { content: 'Foundational insight: The Earth is round.' },
            classifications: [{ name: 'origin', value: 'assertion' }],
          },
        ],
      })

    expect(res.statusCode).toBe(201)
    rootId = res.body.entities[0].id
  })

  it('creates child1 and child2 from root in one activity (sibling test)', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/perform/activity')
      .send({
        agent,
        activity: {
          action: 'derive-implications',
          timestamp: new Date().toISOString(),
        },
        usedEntityIds: [rootId],
        generatedEntities: [
          {
            payload: { content: 'The horizon curves at altitude.' },
            classifications: [{ name: 'evidence', value: 'visual' }],
          },
          {
            payload: { content: 'Global circumnavigation is possible.' },
            classifications: [{ name: 'inference', value: 'navigation' }],
          },
        ],
      })

    expect(res.statusCode).toBe(201)
    child1Id = res.body.entities[0].id
    child2Id = res.body.entities[1].id
  })

  it('creates grandchild from child1', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/perform/activity')
      .send({
        agent,
        activity: {
          action: 'model-extension',
          timestamp: new Date().toISOString(),
        },
        usedEntityIds: [child1Id],
        generatedEntities: [
          {
            payload: { content: 'Satellite images confirm curvature.' },
            classifications: [{ name: 'proof', value: 'aerial' }],
          },
        ],
      })

    expect(res.statusCode).toBe(201)
    grandchildId = res.body.entities[0].id
  })

  it('resolves ancestry from grandchild back to root', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/ancestry')
      .query({ entityId: grandchildId, depth: 5 })

    expect(res.statusCode).toBe(200)
    const ids = res.body
    expect(ids).toContain(rootId)
    expect(ids).toContain(child1Id)
    expect(ids).toContain(grandchildId)
    expect(ids).not.toContain(child2Id) // not in the chain
  })

  it('detects sibling relationship between child1 and child2', async () => {
    const res1 = await request(BASE_URL)
      .get('/api/product/siblings')
      .query({ entityId: child1Id })

    expect(res1.statusCode).toBe(200)
    const siblings1 = res1.body.map((e: any) => e.id)
    expect(siblings1).toContain(child2Id)

    const res2 = await request(BASE_URL)
      .get('/api/product/siblings')
      .query({ entityId: child2Id })

    expect(res2.statusCode).toBe(200)
    const siblings2 = res2.body.map((e: any) => e.id)
    expect(siblings2).toContain(child1Id)
  })
})
