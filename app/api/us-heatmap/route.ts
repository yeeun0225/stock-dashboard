import { NextResponse } from 'next/server'
import { US_SECTORS } from '@/lib/us-stocks'
import { fetchTossPrices, fetchTossPreviousCloses } from '@/lib/toss'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // US tickers (AAPL 등) are already valid Toss symbols
    const allSymbols = US_SECTORS.flatMap((s) => s.stocks.map((st) => st.ticker))
    const uniqueSymbols = [...new Set(allSymbols)]

    const [prices, prevCloses] = await Promise.all([
      fetchTossPrices(uniqueSymbols),
      fetchTossPreviousCloses(uniqueSymbols),
    ])

    const sectors = US_SECTORS.map((sg) => ({
      sector: sg.sector,
      stocks: sg.stocks.map((st) => {
        const price = prices.get(st.ticker)?.lastPrice ?? 0
        const prevClose = prevCloses.get(st.ticker) ?? 0
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
      { sectors, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error('[us-heatmap]', err)
    return NextResponse.json({ error: 'Failed to fetch US heatmap data' }, { status: 500 })
  }
}
