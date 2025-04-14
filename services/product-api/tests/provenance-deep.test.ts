// services/product-api/test/deep-provenance.test.ts

import request from 'supertest'

const BASE_URL = 'http://localhost:3001'
const actor = {
  id: 'test.actor.deep.1',
  name: 'Deep Provenance Tester',
  version: '1.0.0',
  actorKind: 'automated',
}

let rootId: string
let child1Id: string
let child2Id: string
let grandchildId: string

describe('🌲 Deep Provenance Tree Tests', () => {
  it('creates a root entity', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/create/entities')
      .send({
        actor,
        entities: [
          {
            payload: { content: 'root node' },
            provenance: {
              action: 'root',
              timestamp: new Date().toISOString(),
              inputEntityIds: [],
            },
            classifications: [{ name: 'depth', value: '0' }],
          },
        ],
      })

    expect(res.statusCode).toBe(201)
    rootId = res.body.entities[0].id
  })

  it('creates a single edge that outputs both child1 and child2', async () => {
    const res1 = await request(BASE_URL)
      .post('/api/product/create/entities')
      .send({
        actor,
        entities: [
          {
            payload: { content: 'child 1' },
            provenance: {
              action: 'fork',
              timestamp: new Date().toISOString(),
              inputEntityIds: [rootId],
            },
            classifications: [{ name: 'depth', value: '1' }],
          },
          {
            payload: { content: 'child 2' },
            provenance: {
              action: 'fork',
              timestamp: new Date().toISOString(),
              inputEntityIds: [rootId],
            },
            classifications: [{ name: 'depth', value: '1' }],
          },
        ],
      })

    expect(res1.statusCode).toBe(201)
    child1Id = res1.body.entities[0].id
    child2Id = res1.body.entities[1].id
  })

  it('creates a grandchild from child 1', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/create/entities')
      .send({
        actor,
        entities: [
          {
            payload: { content: 'grandchild' },
            provenance: {
              action: 'transform',
              timestamp: new Date().toISOString(),
              inputEntityIds: [child1Id],
            },
            classifications: [{ name: 'depth', value: '2' }],
          },
        ],
      })

    expect(res.statusCode).toBe(201)
    grandchildId = res.body.entities[0].id
  })

  it('fetches full ancestry for the grandchild', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/ancestry')
      .query({ entityId: grandchildId, depth: 3 })

    expect(res.statusCode).toBe(200)
    const ids = res.body
    expect(ids).toContain(rootId)
    expect(ids).toContain(child1Id)
    expect(ids).toContain(grandchildId)
    expect(ids).not.toContain(child2Id) // not in the direct path
  })

  it('finds siblings of child1 and child2 correctly', async () => {
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
