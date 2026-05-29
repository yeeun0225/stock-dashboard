import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })

export interface LeverageItem {
  symbol:        string
  price:         number
  dayChange:     number
  dayChangePct:  number
  volume:        number
  avgVolume:     number      // 3개월 평균
  monthChangePct: number
}

export interface LeverageSentimentData {
  tqqq:              LeverageItem
  sqqq:              LeverageItem
  volumeScore:       number       // 0~100, 50=중립, >50=강세 거래량 우세
  ratioHistory:      number[]     // TQQQ/SQQQ 비율 최근 25일 (스파크라인)
  ratio5dChangePct:  number       // 5일 비율 변화율
  signal:            string
  signalType:        'bullish' | 'bearish' | 'neutral'
  timestamp:         number
}

export async function GET() {
  try {
    const SYMS = ['TQQQ', 'SQQQ']

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes = await yf.quote(SYMS, {}, { validateResult: false }) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qmap = new Map<string, any>()
    for (const q of quotes) if (q?.symbol) qmap.set(q.symbol, q)

    // 역사 데이터 (일봉, 40일) — period2 필수, Promise.allSettled로 부분 실패 허용
    const period1 = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    const period2 = new Date()
    const [tRes, sRes] = await Promise.allSettled([
      yf.historical('TQQQ', { period1, period2, interval: '1d' }, { validateResult: false }),
      yf.historical('SQQQ', { period1, period2, interval: '1d' }, { validateResult: false }),
    ])
    const tHist = tRes.status === 'fulfilled' ? tRes.value : []
    const sHist = sRes.status === 'fulfilled' ? sRes.value : []

    // 날짜 → 종가 맵
    function buildMap(hist: typeof tHist) {
      const m = new Map<string, number>()
      for (const bar of hist) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = bar as any
        const date: string = b.date instanceof Date
          ? b.date.toISOString().split('T')[0]
          : String(b.date).split('T')[0]
        const price = b.adjClose ?? b.close ?? 0
        if (price > 0) m.set(date, price)
      }
      return m
    }

    const tMap = buildMap(tHist)
    const sMap = buildMap(sHist)

    // TQQQ/SQQQ 비율 히스토리
    const dates = [...tMap.keys()].filter(d => sMap.has(d)).sort()
    const ratioHistory = dates.slice(-25).map(d => tMap.get(d)! / sMap.get(d)!)

    // 5일 비율 변화율
    function change5d(arr: number[]) {
      if (arr.length < 6) return 0
      const cur  = arr[arr.length - 1]
      const prev = arr[arr.length - 6]
      return prev > 0 ? ((cur / prev) - 1) * 100 : 0
    }
    const ratio5dChangePct = change5d(ratioHistory)

    // 1개월 변화율
    function monthChange(m: Map<string, number>, currentPrice: number) {
      const sorted = [...m.keys()].sort()
      if (sorted.length < 2) return 0
      const old = m.get(sorted[0]) ?? 0
      return old > 0 ? ((currentPrice / old) - 1) * 100 : 0
    }

    const tQ = qmap.get('TQQQ')
    const sQ = qmap.get('SQQQ')

    const tqqq: LeverageItem = {
      symbol:         'TQQQ',
      price:          tQ?.regularMarketPrice           ?? 0,
      dayChange:      tQ?.regularMarketChange           ?? 0,
      dayChangePct:   tQ?.regularMarketChangePercent    ?? 0,
      volume:         tQ?.regularMarketVolume           ?? 0,
      avgVolume:      tQ?.averageDailyVolume3Month      ?? 0,
      monthChangePct: monthChange(tMap, tQ?.regularMarketPrice ?? 0),
    }
    const sqqq: LeverageItem = {
      symbol:         'SQQQ',
      price:          sQ?.regularMarketPrice           ?? 0,
      dayChange:      sQ?.regularMarketChange           ?? 0,
      dayChangePct:   sQ?.regularMarketChangePercent    ?? 0,
      volume:         sQ?.regularMarketVolume           ?? 0,
      avgVolume:      sQ?.averageDailyVolume3Month      ?? 0,
      monthChangePct: monthChange(sMap, sQ?.regularMarketPrice ?? 0),
    }

    // 거래량 점수 (0~100)
    const totalVol   = (tqqq.volume + sqqq.volume) || 1
    const volumeScore = Math.round((tqqq.volume / totalVol) * 100)

    // 신호 — 비율 5일 변화율 기준
    let signal     = '중립'
    let signalType: LeverageSentimentData['signalType'] = 'neutral'
    if (ratio5dChangePct >  5) { signal = '강세 베팅 우세'; signalType = 'bullish' }
    if (ratio5dChangePct < -5) { signal = '약세 베팅 우세'; signalType = 'bearish' }

    return NextResponse.json<LeverageSentimentData>(
      { tqqq, sqqq, volumeScore, ratioHistory, ratio5dChangePct, signal, signalType, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/leverage-sentiment]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
