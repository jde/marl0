import { getProvenanceTimeline } from '@/services/provenance'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const depth = Number(searchParams.get('depth') || '2')

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing entity ID' }), { status: 400 })
  }

  try {
    const data = await getProvenanceTimeline(id, depth)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Provenance fetch error:', err)
    return new Response(JSON.stringify({ error: 'Failed to load provenance' }), { status: 500 })
  }
}
