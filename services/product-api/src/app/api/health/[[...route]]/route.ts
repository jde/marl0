// src/app/api/product/[[...route]]/route.ts

import * as Read from '@/services/read'
import { CreateItemsArgs } from '@/services/types'
import * as Utils from '@/services/utils'
import * as Write from '@/services/write'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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
    routeParams: ['create', 'items'],
    routeHandler: async ({ body }) => {
      const parsed = z.object({
        actor: z.object({
          id: z.string(),
          name: z.string(),
          version: z.string(),
          actorKind: z.enum(['human', 'automated', 'hybrid']),
          actorMethod: z.string().optional(),
        }),
        items: z.array(z.any()),
      }).parse(body) satisfies CreateItemsArgs

      await Write.ensureActor(parsed.actor)
      return Write.createItems(parsed.actor, parsed.items)
    },
  },
  {
    method: 'GET',
    routeParams: ['item'],
    routeHandler: async ({ query }) => Read.getItemById(query.get('id') || ''),
  },
  {
    method: 'GET',
    routeParams: ['actor'],
    routeHandler: async ({ query }) => Read.getActorById(query.get('id') || ''),
  },
  {
    method: 'GET',
    routeParams: ['classifications'],
    routeHandler: async ({ query }) => Read.getClassifications(query.get('itemId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['classification', 'history'],
    routeHandler: async ({ query }) =>
      Read.getClassificationHistory(query.get('itemId') || '', query.get('name') || undefined),
  },
  {
    method: 'GET',
    routeParams: ['items', 'by-label'],
    routeHandler: async ({ query }) =>
      Read.getItemsByLabel(query.get('name') || '', query.get('value') || ''),
  },
  {
    method: 'GET',
    routeParams: ['provenance'],
    routeHandler: async ({ query }) =>
      Read.getProvenance(query.get('itemId') || '', parseInt(query.get('depth') || '1')),
  },
  {
    method: 'GET',
    routeParams: ['provenance', 'timeline'],
    routeHandler: async ({ query }) =>
      Read.getProvenanceTimeline(query.get('itemId') || '', parseInt(query.get('depth') || '1')),
  },
  {
    method: 'GET',
    routeParams: ['siblings'],
    routeHandler: async ({ query }) => Read.getSiblings(query.get('itemId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['ancestry'],
    routeHandler: async ({ query }) =>
      Utils.getAncestry(query.get('itemId') || '', parseInt(query.get('depth') || '3')),
  },
  {
    method: 'GET',
    routeParams: ['consensus', 'labels'],
    routeHandler: async ({ query }) => Utils.getConsensusLabels(query.get('itemId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['classification', 'diffs'],
    routeHandler: async ({ query }) =>
      Utils.getClassificationDiffs(query.get('itemA') || '', query.get('itemB') || ''),
  },
  {
    method: 'GET',
    routeParams: ['forks', 'from'],
    routeHandler: async ({ query }) => Utils.getForksFrom(query.get('itemId') || ''),
  },
  {
    method: 'GET',
    routeParams: ['latest', 'versions'],
    routeHandler: async ({ query }) => Utils.getLatestVersionsOf(query.get('itemId') || ''),
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
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
