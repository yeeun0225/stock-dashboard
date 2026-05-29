import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { KR_SECTORS } from '@/lib/kr-stocks'

export const dynamic = 'force-dynamic'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export interface KrStockQuote {
  ticker: string
  name: string
  price: number
  changePercent: number
}

export interface KrSectorData {
  sector: string
  stocks: KrStockQuote[]
}

export async function GET() {
  try {
    const allTickers = KR_SECTORS.flatMap((s) => s.stocks.map((st) => st.ticker))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (await yf.quote(allTickers, {}, { validateResult: false })) as any[]

    // Build a map by symbol so order doesn't matter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteMap = new Map<string, any>()
    for (const q of results) {
      if (q?.symbol) quoteMap.set(q.symbol, q)
    }

    const sectors: KrSectorData[] = KR_SECTORS.map((sg) => ({
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
    console.error('[kr-heatmap]', err)
    return NextResponse.json({ error: 'Failed to fetch KR heatmap data' }, { status: 500 })
  }
}
