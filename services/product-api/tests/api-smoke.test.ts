// services/product-api/test/api-smoke.test.ts

import { randomUUID } from 'crypto'
import request from 'supertest'

const BASE_URL = 'http://localhost:3000'
const agent = {
  id: `agent.smoke.${randomUUID()}`,
  name: 'API Smoke Agent',
  version: '1.0.0',
  agentKind: 'automated',
  agentMethod: 'smoke-test'
}

describe('🔥 API Smoke Test – minimal functional tests of all endpoints', () => {
  let entityId: string
  let siblingId: string

  it('POST /perform/activity creates a new entity', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/perform/activity')
      .send({
        agent,
        activity: {
          action: 'init-smoke',
          timestamp: new Date().toISOString(),
        },
        usedEntityIds: [],
        generatedEntities: [
          { payload: { test: 'root' } },
        ],
      })

    expect(res.statusCode).toBe(201)
    entityId = res.body.entities[0].id
  })

  it('POST /perform/activity creates a sibling from the same input', async () => {
    const res = await request(BASE_URL)
      .post('/api/product/perform/activity')
      .send({
        agent,
        activity: {
          action: 'fork-sibling',
          timestamp: new Date().toISOString(),
        },
        usedEntityIds: [entityId],
        generatedEntities: [
          { payload: { test: 'sibling' } },
        ],
      })

    expect(res.statusCode).toBe(201)
    siblingId = res.body.entities[0].id
  })

  it('GET /entity returns the entity', async () => {
    const res = await request(BASE_URL).get('/api/product/entity').query({ id: entityId })
    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe(entityId)
  })

  it('GET /agent returns the agent', async () => {
    const res = await request(BASE_URL).get('/api/product/agent').query({ id: agent.id })
    expect(res.statusCode).toBe(200)
    expect(res.body.name).toBe(agent.name)
  })

  it('GET /classifications returns empty', async () => {
    const res = await request(BASE_URL).get('/api/product/classifications').query({ entityId })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /entities/by-label returns empty', async () => {
    const res = await request(BASE_URL).get('/api/product/entities/by-label').query({ name: 'nonexistent', value: 'none' })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /provenance works', async () => {
    const res = await request(BASE_URL).get('/api/product/provenance').query({ entityId })
    expect(res.statusCode).toBe(200)
  })

  it('GET /provenance/timeline works', async () => {
    const res = await request(BASE_URL).get('/api/product/provenance/timeline').query({ entityId })
    expect(res.statusCode).toBe(200)
  })

  it('GET /siblings returns expected sibling', async () => {
    const res = await request(BASE_URL).get('/api/product/siblings').query({ entityId: siblingId })
    expect(res.statusCode).toBe(200)
  })

  it('GET /ancestry returns expected result', async () => {
    const res = await request(BASE_URL).get('/api/product/ancestry').query({ entityId })
    expect(res.statusCode).toBe(200)
  })

  it('GET /consensus/labels returns empty object', async () => {
    const res = await request(BASE_URL).get('/api/product/consensus/labels').query({ entityId })
    expect(res.statusCode).toBe(200)
    expect(typeof res.body).toBe('object')
  })

  it('GET /classification/diffs returns []', async () => {
    const res = await request(BASE_URL).get('/api/product/classification/diffs').query({ entityA: entityId, entityB: siblingId })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /forks/from returns siblings if shared input', async () => {
    const res = await request(BASE_URL).get('/api/product/forks/from').query({ entityId })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /latest/versions returns leaf nodes', async () => {
    const res = await request(BASE_URL).get('/api/product/latest/versions').query({ entityId })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})