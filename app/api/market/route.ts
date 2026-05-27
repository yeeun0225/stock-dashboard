import { NextResponse } from 'next/server'
import { fetchMarketData } from '@/lib/market-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await fetchMarketData()
  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
  }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
