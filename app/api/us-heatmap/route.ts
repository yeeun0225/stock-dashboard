import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { US_SECTORS } from '@/lib/us-stocks'

export const dynamic = 'force-dynamic'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export async function GET() {
  try {
    const allTickers = US_SECTORS.flatMap((s) => s.stocks.map((st) => st.ticker))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (await yf.quote(allTickers, {}, { validateResult: false })) as any[]

    // Build a map by symbol so order doesn't matter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteMap = new Map<string, any>()
    for (const q of results) {
      if (q?.symbol) quoteMap.set(q.symbol, q)
    }

    const sectors = US_SECTORS.map((sg) => ({
      sector: sg.sector,
      stocks: sg.stocks.map((st) => {
        const q = quoteMap.get(st.ticker)
        return {
          ticker: st.ticker,
          name: st.name,
          price: q?.regularMarketPrice ?? 0,
          changePercent: q?.regularMarketChangePercent ?? 0,
        }
      }),
    }))

    return NextResponse.json(
      { sectors, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error('[us-heatmap]', err)
    return NextResponse.json({ error: 'Failed to fetch US heatmap data' }, { status: 500 })
  }
}
