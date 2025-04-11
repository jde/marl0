import { db } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', db: 'connected' }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ status: 'error', db: 'disconnected' }, { status: 500 })
  }
}
