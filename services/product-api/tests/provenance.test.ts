// services/product-api/test/provenance.test.ts

import request from 'supertest'

const BASE_URL = 'http://localhost:3001'
const actor = {
  id: 'test.actor.2',
  name: 'Provenance Tester',
  version: '1.0.0',
  actorKind: 'automated',
}

let baseEntityId: string
let derivedEntityId: string

describe('🔗 Provenance API Tests', () => {
  it('creates a base entity with no inputs', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/create/entities')
      .send({
        actor,
        entities: [
          {
            payload: { content: 'origin entity' },
            provenance: {
              action: 'origin',
              timestamp: new Date().toISOString(),
              inputEntityIds: [],
            },
            classifications: [{ name: 'stage', value: 'raw' }],
          },
        ],
      })
    expect(res.statusCode).toBe(201)
    baseEntityId = res.body.entities[0].id
  })

  it('creates a second entity using the first as input', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/create/entities')
      .send({
        actor,
        entities: [
          {
            payload: { content: 'derived entity' },
            provenance: {
              action: 'transform',
              timestamp: new Date().toISOString(),
              inputEntityIds: [baseEntityId],
            },
            classifications: [{ name: 'stage', value: 'processed' }],
          },
        ],
      })
    expect(res.statusCode).toBe(201)
    derivedEntityId = res.body.entities[0].id
  })

  it('verifies that base entity is listed as input to derived entity', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/provenance')
      .query({ entityId: derivedEntityId })

    expect(res.statusCode).toBe(200)
    const inputIds = res.body.flatMap((edge: any) => edge.inputs.map((i: any) => i.entityId))
    expect(inputIds).toContain(baseEntityId)
  })

    it('verifies that derived entity is traceable back to base via timeline', async () => {
    const res = await request(BASE_URL)
        .get('/api/product/provenance/timeline')
        .query({ entityId: derivedEntityId, depth: 3 })

    expect(res.statusCode).toBe(200)
    const ids = res.body.map((e: any) => e.id)
    expect(ids).toContain(baseEntityId)
    expect(ids).toContain(derivedEntityId)
    })


  it('retrieves a full timeline from the derived entity back to the base', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/provenance/timeline')
      .query({ entityId: derivedEntityId, depth: 3 })

    expect(res.statusCode).toBe(200)
    const ids = res.body.map((e: any) => e.id)
    expect(ids).toContain(baseEntityId)
    expect(ids).toContain(derivedEntityId)
  })
})
