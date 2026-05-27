import { NextResponse } from 'next/server'
import { fetchFearGreedData } from '@/lib/market-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await fetchFearGreedData()
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
