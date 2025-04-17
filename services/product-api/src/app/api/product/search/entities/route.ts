import { searchEntities } from '@/services/search'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const filters = {
    agent: searchParams.get('agent') || undefined,
    section: searchParams.get('section') || undefined,
    source: searchParams.get('source') || undefined,
    q: searchParams.get('q') || undefined,
    page: Number(searchParams.get('page') || 1),
    perPage: Number(searchParams.get('perPage') || 10),
  }

  try {
    const result = await searchEntities(filters)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Search error:', err)
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
    })
  }
}
