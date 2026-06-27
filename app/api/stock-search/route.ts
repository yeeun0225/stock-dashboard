import { NextRequest, NextResponse } from 'next/server'
import { searchStocks } from '@/lib/stock-master'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  try {
    const results = await searchStocks(q, 20)
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[stock-search]', err)
    return NextResponse.json({ error: 'search failed' }, { status: 500 })
  }
}
