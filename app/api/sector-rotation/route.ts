import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })

const SECTORS = [
  { symbol: 'XLK',  name: '기술',        emoji: '💻' },
  { symbol: 'XLC',  name: '커뮤니케이션', emoji: '📡' },
  { symbol: 'XLY',  name: '임의소비재',   emoji: '🛍️' },
  { symbol: 'XLF',  name: '금융',         emoji: '🏦' },
  { symbol: 'XLI',  name: '산업재',       emoji: '🏭' },
  { symbol: 'XLV',  name: '헬스케어',     emoji: '💊' },
  { symbol: 'XLB',  name: '소재',         emoji: '⛏️' },
  { symbol: 'XLE',  name: '에너지',       emoji: '⚡' },
  { symbol: 'XLP',  name: '필수소비재',   emoji: '🛒' },
  { symbol: 'XLRE', name: '부동산',       emoji: '🏠' },
  { symbol: 'XLU',  name: '유틸리티',     emoji: '💡' },
]

export interface SectorItem {
  symbol:        string
  name:          string
  emoji:         string
  price:         number
  dayChangePct:  number
  monthChangePct: number
}

export interface SectorRotationData {
  sectors:   SectorItem[]   // 1개월 수익률 내림차순 정렬
  timestamp: number
}

export async function GET() {
  try {
    const symbols = SECTORS.map(s => s.symbol)

    // 현재가 배치 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes = await yf.quote(symbols, {}, { validateResult: false }) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qmap = new Map<string, any>()
    for (const q of quotes) if (q?.symbol) qmap.set(q.symbol, q)

    // 1개월 역사 데이터 (주봉) — period2 필수
    const period1 = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    const period2 = new Date()
    const hists = await Promise.allSettled(
      symbols.map(sym =>
        yf.historical(sym, { period1, period2, interval: '1wk' }, { validateResult: false })
      )
    )

    const sectors: SectorItem[] = SECTORS.map(({ symbol, name, emoji }, i) => {
      const q            = qmap.get(symbol)
      const currentPrice = q?.regularMarketPrice       ?? 0
      const dayChangePct = q?.regularMarketChangePercent ?? 0

      let monthChangePct = dayChangePct
      const hist = hists[i]
      if (hist.status === 'fulfilled' && hist.value.length >= 2) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const first = hist.value[0] as any
        const old   = first?.adjClose ?? first?.close ?? 0
        if (old > 0 && currentPrice > 0) {
          monthChangePct = ((currentPrice / old) - 1) * 100
        }
      }

      return { symbol, name, emoji, price: currentPrice, dayChangePct, monthChangePct }
    })

    // 1개월 수익률 내림차순
    sectors.sort((a, b) => b.monthChangePct - a.monthChangePct)

    return NextResponse.json<SectorRotationData>(
      { sectors, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/sector-rotation]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
