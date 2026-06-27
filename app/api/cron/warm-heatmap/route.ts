import { NextResponse } from 'next/server'
import { KR_SECTORS } from '@/lib/kr-stocks'
import { US_SECTORS } from '@/lib/us-stocks'
import { fetchTossPreviousCloses } from '@/lib/toss'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 전일종가 478개 candles 조회 — 넉넉히

/**
 * 히트맵 전일종가 사전 워밍.
 * KR + US 전 종목의 전일종가를 토스 candles 로 받아 Supabase(prev_closes)에 저장한다.
 * 이후 사용자 요청은 DB 에서 즉시 로드되어 빠르게 응답한다.
 *
 * Vercel Cron 이 장 시작 전(예: 07:30 KST = 22:30 UTC) 호출.
 */
function toTossSymbol(ticker: string): string {
  return ticker.split('.')[0]
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const krSymbols = KR_SECTORS.flatMap((s) => s.stocks.map((st) => toTossSymbol(st.ticker)))
  const usSymbols = US_SECTORS.flatMap((s) => s.stocks.map((st) => st.ticker))
  const symbols = [...new Set([...krSymbols, ...usSymbols])]

  try {
    const prevCloses = await fetchTossPreviousCloses(symbols)
    const warmed = [...prevCloses.values()].filter((v) => v > 0).length

    return NextResponse.json({
      ok: true,
      total: symbols.length,
      warmed,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[warm-heatmap]', err)
    return NextResponse.json({ error: 'warm failed' }, { status: 500 })
  }
}
