import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const YIELDS = [
  { symbol: '^IRX', label: '3M', maturity: 0.25 },
  { symbol: '^FVX', label: '5Y', maturity: 5 },
  { symbol: '^TNX', label: '10Y', maturity: 10 },
  { symbol: '^TYX', label: '30Y', maturity: 30 },
]

export interface YieldPoint {
  label: string
  symbol: string
  maturity: number
  value: number
  change: number
  changePercent: number
}

export interface YieldsAPIData {
  yields: YieldPoint[]
  timestamp: number
}

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await yf.quote(YIELDS.map(y => y.symbol), {}, { validateResult: false }) as any[]
    const map = new Map<string, any>()
    for (const q of results) if (q?.symbol) map.set(q.symbol, q)

    const yields: YieldPoint[] = YIELDS.map(({ symbol, label, maturity }) => {
      const q = map.get(symbol)
      return {
        label,
        symbol,
        maturity,
        value: q?.regularMarketPrice ?? 0,
        change: q?.regularMarketChange ?? 0,
        changePercent: q?.regularMarketChangePercent ?? 0,
      }
    })

    return NextResponse.json<YieldsAPIData>({ yields, timestamp: Date.now() }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[/api/yields]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
