import { NextResponse } from 'next/server'
import { KR_SECTORS } from '@/lib/kr-stocks'
import { fetchTossPrices, fetchTossPreviousCloses, detectKrSession } from '@/lib/toss'

export const dynamic = 'force-dynamic'

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

// Yahoo Finance format (005930.KS) → Toss format (005930)
function toTossSymbol(ticker: string): string {
  return ticker.split('.')[0]
}

export async function GET() {
  try {
    const session = detectKrSession()

    // Collect all Toss symbols
    const allSymbols = KR_SECTORS.flatMap((s) => s.stocks.map((st) => toTossSymbol(st.ticker)))
    const uniqueSymbols = [...new Set(allSymbols)]

    const [prices, prevCloses] = await Promise.all([
      fetchTossPrices(uniqueSymbols),
      fetchTossPreviousCloses(uniqueSymbols),
    ])

    const sectors: KrSectorData[] = KR_SECTORS.map((sg) => ({
      sector: sg.sector,
      stocks: sg.stocks.map((st) => {
        const sym = toTossSymbol(st.ticker)
        const price = prices.get(sym)?.lastPrice ?? 0
        const prevClose = prevCloses.get(sym) ?? 0
        const changePercent =
          prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0

        return {
          ticker: st.ticker,
          name: st.name,
          price,
          changePercent,
        }
      }),
    }))

    return NextResponse.json(
      { sectors, session, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error('[kr-heatmap]', err)
    return NextResponse.json({ error: 'Failed to fetch KR heatmap data' }, { status: 500 })
  }
}
