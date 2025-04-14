// tests/product-api/product-api.test.ts

import request from 'supertest'

const BASE_URL = 'http://localhost:3001'

const actor = {
  id: 'test.actor.1',
  name: 'Test Actor',
  version: '0.1.0',
  actorKind: 'automated',
}

describe('🧪 Product API E2E Test Suite', () => {
  let entityId: string

  it('POST /api/product/create/entities creates entity + provenance + classification', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/create/entities')
      .send({
        actor,
        entities: [
          {
            payload: { content: 'hello marl0' },
            provenance: {
              action: 'test-ingest',
              timestamp: new Date().toISOString(),
              inputEntityIds: [],
            },
            classifications: [
              {
                name: 'source',
                value: 'test-suite',
                confidence: 1,
              },
            ],
          },
        ],
      })

    expect(res.statusCode).toBe(201)
    expect(res.body.entities.length).toBe(1)
    expect(res.body.provenanceEdges.length).toBe(1)
    entityId = res.body.entities[0].id
  })

  it('GET /api/product/entity returns the created entity', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/entity')
      .query({ id: entityId })

    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe(entityId)
    expect(res.body.payload.content).toBe('hello marl0')
  })

  it('GET /api/product/classifications returns classifications for the entity', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/classifications')
      .query({ entityId })

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0].name).toBe('source')
    expect(res.body[0].value).toBe('test-suite')
  })

  it('GET /api/product/provenance returns the provenance edge', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/provenance')
      .query({ entityId })

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0].action).toBe('test-ingest')
  })

  it('GET /api/product/consensus/labels returns classification consensus', async () => {
    const res = await request(BASE_URL)
      .get('/api/product/consensus/labels')
      .query({ entityId })

    expect(res.statusCode).toBe(200)
    expect(res.body.source).toBe('test-suite')
  })
})
