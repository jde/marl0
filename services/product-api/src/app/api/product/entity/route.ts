import { getEntityById } from '@/services/entity'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing entity ID' }), { status: 400 })
  }

  try {
    const data = await getEntityById(id)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Failed to build entity view:', err)
    return new Response(JSON.stringify({ error: 'Failed to load entity' }), { status: 500 })
  }
}
