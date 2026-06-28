import { NextRequest, NextResponse } from 'next/server'
import { searchStocks, searchTossDirect } from '@/lib/stock-master'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  try {
    const results = await searchStocks(q, 20)

    // 폴백: 입력이 티커형인데 마스터에 없으면 토스에서 직접 조회
    // (미국·한국의 모든 ETF/종목을 티커로 조회 가능하게)
    const qSym = q.toUpperCase().split('.')[0]
    const alreadyHave = results.some((r) => r.tossSymbol.toUpperCase() === qSym)
    if (!alreadyHave) {
      const direct = await searchTossDirect(q)
      if (direct) results.unshift(direct)
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[stock-search]', err)
    return NextResponse.json({ error: 'search failed' }, { status: 500 })
  }
}
