// src/app/api/product/[[...route]]/route.ts

import * as Read from '@/services/read'
import * as Utils from '@/services/utils'
import * as Write from '@/services/write'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteDefinition = {
  method: 'GET' | 'POST'
  routeParams: string[]
  routeHandler: (args: {
    route: string[]
    query: URLSearchParams
    body?: any
  }) => Promise<any>
}

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    routeParams: ['perform', 'activity'],
    routeHandler: async ({ body }) => {
      await Write.ensureAgent(body.agent)
      return Write.performActivityWithFirehose(body)
    },
  },
  {
    method: 'GET',
    routeParams: ['entity'],
    routeHandler: async ({ query }) => Read.getEntityById(query.get('id') || ''),
  },
  {
    method: 'GET',
    routeParams: ['agent'],
    routeHandler: async ({ query }) => Read.getAgentById(query.get('id') || ''),
  },
  {
    method: 'GET',
    routeParams: ['classifications'],
    routeHandler: async ({ query }) => Read.getClassifications(query.get('entityId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['classification', 'history'],
    routeHandler: async ({ query }) =>
      Read.getClassificationHistory(query.get('entityId') || '', query.get('name') || undefined),
  },
  {
    method: 'GET',
    routeParams: ['entities', 'by-label'],
    routeHandler: async ({ query }) =>
      Read.getEntitiesByLabel(query.get('name') || '', query.get('value') || ''),
  },
  {
    method: 'GET',
    routeParams: ['provenance'],
    routeHandler: async ({ query }) =>
      Read.getProvenance(query.get('entityId') || '', parseInt(query.get('depth') || '1')),
  },
  {
    method: 'GET',
    routeParams: ['provenance', 'timeline'],
    routeHandler: async ({ query }) =>
      Read.getProvenanceTimeline(query.get('entityId') || '', parseInt(query.get('depth') || '1')),
  },
  {
    method: 'GET',
    routeParams: ['siblings'],
    routeHandler: async ({ query }) => Read.getSiblings(query.get('entityId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['ancestry'],
    routeHandler: async ({ query }) =>
      Utils.getAncestry(query.get('entityId') || '', parseInt(query.get('depth') || '3')),
  },
  {
    method: 'GET',
    routeParams: ['consensus', 'labels'],
    routeHandler: async ({ query }) => Utils.getConsensusLabels(query.get('entityId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['classification', 'diffs'],
    routeHandler: async ({ query }) =>
      Utils.getClassificationDiffs(query.get('entityA') || '', query.get('entityB') || ''),
  },
  {
    method: 'GET',
    routeParams: ['forks', 'from'],
    routeHandler: async ({ query }) => Utils.getForksFrom(query.get('entityId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['latest', 'versions'],
    routeHandler: async ({ query }) => Utils.getLatestVersionsOf(query.get('entityId') || ''),
  },
]

function matchRoute(route: string[], method: 'GET' | 'POST') {
  return routes.find((r) => {
    if (r.method !== method) return false
    if (r.routeParams.length !== route.length) return false
    return r.routeParams.every((segment, i) => segment.startsWith(':') || segment === route[i])
  })
}

function parsePath(pathname: string): string[] {
  return pathname
    .split('/api/product/')[1]
    ?.split('/')
    .filter(Boolean) || []
}

export async function GET(req: NextRequest) {
  const route = parsePath(new URL(req.url).pathname)
  const matched = matchRoute(route, 'GET')

  if (!matched) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const result = await matched.routeHandler({ route, query: new URL(req.url).searchParams })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const route = parsePath(url.pathname)
  const matched = matchRoute(route, 'POST')

  if (!matched) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = await matched.routeHandler({ route, query: url.searchParams, body })
    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    console.error(`Error in POST /api/product/${route.join('/')}:`, err)

    return new Response(
      JSON.stringify({ error: "invalid request", detail: err instanceof Error ? err.message : err }),
      { status: 400 }
    )
  }
}
