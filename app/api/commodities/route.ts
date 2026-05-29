import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })

const COMMODITIES = [
  { symbol: 'CL=F',  name: 'WTI 원유',    emoji: '🛢️', category: '에너지' },
  { symbol: 'NG=F',  name: '천연가스',     emoji: '🔥', category: '에너지' },
  { symbol: 'GC=F',  name: '금',           emoji: '🥇', category: '귀금속' },
  { symbol: 'SI=F',  name: '은',           emoji: '🥈', category: '귀금속' },
  { symbol: 'HG=F',  name: '구리',         emoji: '🔧', category: '금속' },
  { symbol: 'ZC=F',  name: '옥수수',       emoji: '🌽', category: '농산물' },
  { symbol: 'ZW=F',  name: '밀',           emoji: '🌾', category: '농산물' },
  { symbol: 'ZS=F',  name: '대두',         emoji: '🫘', category: '농산물' },
  { symbol: 'KC=F',  name: '커피',         emoji: '☕', category: '농산물' },
  { symbol: 'LIT',   name: '리튬(LIT)',    emoji: '⚡', category: '금속' },
]

export interface CommodityItem {
  symbol: string
  name: string
  emoji: string
  category: string
  price: number
  dayChange: number    // today's change %
  monthChange: number  // ~1-month change %
}

export interface CommoditiesAPIData {
  commodities: CommodityItem[]
  timestamp: number
}

export async function GET() {
  try {
    const symbols = COMMODITIES.map(c => c.symbol)

    // Batch current quotes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes = await yf.quote(symbols, {}, { validateResult: false }) as any[]
    const quoteMap = new Map<string, any>()
    for (const q of quotes) if (q?.symbol) quoteMap.set(q.symbol, q)

    // 1-month historical (weekly, parallel) — period2 필수
    const period1 = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    const period2 = new Date()
    const historicals = await Promise.allSettled(
      COMMODITIES.map(({ symbol }) =>
        yf.historical(symbol, { period1, period2, interval: '1wk' }, { validateResult: false })
      )
    )

    const commodities: CommodityItem[] = COMMODITIES.map(({ symbol, name, emoji, category }, i) => {
      const q = quoteMap.get(symbol)
      const currentPrice = q?.regularMarketPrice ?? 0
      const dayChange = q?.regularMarketChangePercent ?? 0

      // Calculate 1-month change from historical, fall back to day change if unavailable
      let monthChange = dayChange
      const hist = historicals[i]
      if (hist.status === 'fulfilled' && hist.value.length >= 2) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstBar = hist.value[0] as any
        const oldPrice = firstBar?.adjClose ?? firstBar?.close ?? 0
        if (oldPrice > 0 && currentPrice > 0) {
          monthChange = ((currentPrice / oldPrice) - 1) * 100
        }
      }

      return { symbol, name, emoji, category, price: currentPrice, dayChange, monthChange }
    })

    return NextResponse.json<CommoditiesAPIData>({ commodities, timestamp: Date.now() }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[/api/commodities]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
