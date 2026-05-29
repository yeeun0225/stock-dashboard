import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export interface MacroIndicator {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

export interface MacroAPIData {
  vix: MacroIndicator
  move: MacroIndicator
  timestamp: number
}

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await yf.quote(['^VIX', '^MOVE'], {}, { validateResult: false }) as any[]
    const map = new Map<string, any>()
    for (const q of results) if (q?.symbol) map.set(q.symbol, q)

    const toIndicator = (sym: string, name: string): MacroIndicator => {
      const q = map.get(sym)
      return {
        symbol: sym,
        name,
        value: q?.regularMarketPrice ?? 0,
        change: q?.regularMarketChange ?? 0,
        changePercent: q?.regularMarketChangePercent ?? 0,
      }
    }

    return NextResponse.json<MacroAPIData>({
      vix: toIndicator('^VIX', 'VIX'),
      move: toIndicator('^MOVE', 'MOVE Index'),
      timestamp: Date.now(),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[/api/macro]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
