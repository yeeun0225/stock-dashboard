import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })

const SYMBOLS = ['SPY', 'TLT', 'QQQ', 'DIA', 'BTC-USD', 'GC=F', 'HG=F']

// SPY TLT QQQ DIA BTC GC HG
const IDX = { SPY: 0, TLT: 1, QQQ: 2, DIA: 3, BTC: 4, GC: 5, HG: 6 }

export type SignalType = 'neutral' | 'positive' | 'negative'

export interface RatioCard {
  id: string
  pairLabel: string
  description: string
  ratio: number
  ratioChangePct: number
  change5dPct: number       // 5일 비율 변화율 (신호 판단 기준)
  num: { symbol: string; changePercent: number }
  den: { symbol: string; changePercent: number }
  history: number[]
  signal: string
  signalType: SignalType
}

export interface CapitalRatioData {
  cards: RatioCard[]
  timestamp: number
}

// ── 자산별 한국어 이름 & 조사 ─────────────────────────────
const ASSET: Record<string, { name: string; to: string }> = {
  'SPY':     { name: '주식',     to: '주식으로'   },
  'TLT':     { name: '채권',     to: '채권으로'   },
  'QQQ':     { name: '나스닥',   to: '나스닥으로' },
  'DIA':     { name: '다우존스', to: '다우존스로' },
  'BTC-USD': { name: 'BTC',      to: 'BTC로'      },
  'GC=F':    { name: '금',       to: '금으로'     },
  'HG=F':    { name: '구리',     to: '구리로'     },
}

// ── 신호 판단 — 모두 ±2% 기준 ────────────────────────────
function getSignal(
  change5d: number,
  numSym: string,
  denSym: string
): { label: string; type: SignalType } {
  const num = ASSET[numSym]?.name ?? numSym
  const den = ASSET[denSym]?.to   ?? denSym

  if (change5d >  2) return { label: `${num} 선호`, type: 'positive' }
  if (change5d < -2) return { label: `${den} 대피 중`, type: 'negative' }
  return { label: '중립', type: 'neutral' }
}

export async function GET() {
  try {
    // ── 현재가 배치 조회 ────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes = await yf.quote(SYMBOLS, {}, { validateResult: false }) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qmap = new Map<string, any>()
    for (const q of quotes) if (q?.symbol) qmap.set(q.symbol, q)

    const getQ = (sym: string) => qmap.get(sym)

    // ── 역사 데이터 병렬 조회 (스파크라인 + 5일 변화율) ────
    const period1 = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    const period2 = new Date()
    const hists = await Promise.allSettled(
      SYMBOLS.map(sym =>
        yf.historical(sym, { period1, period2, interval: '1d' }, { validateResult: false })
      )
    )

    // 심볼별 날짜 → 종가 맵
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priceMaps = SYMBOLS.map((_, i) => {
      const m = new Map<string, number>()
      const h = hists[i]
      if (h.status === 'fulfilled') {
        for (const bar of h.value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = bar as any
          const date: string = b.date instanceof Date
            ? b.date.toISOString().split('T')[0]
            : String(b.date).split('T')[0]
          const price: number = b.adjClose ?? b.close ?? 0
          if (price > 0) m.set(date, price)
        }
      }
      return m
    })

    // 두 심볼의 공통 날짜로 비율 히스토리 계산
    function ratioHistory(numIdx: number, denIdx: number): number[] {
      const nm = priceMaps[numIdx]
      const dm = priceMaps[denIdx]
      const dates = [...nm.keys()].filter(d => dm.has(d)).sort()
      return dates.slice(-25).map(d => nm.get(d)! / dm.get(d)!)
    }

    // 5일 변화율 계산
    function change5d(hist: number[]): number {
      if (hist.length < 6) return 0
      const cur  = hist[hist.length - 1]
      const prev = hist[hist.length - 6]
      if (!prev) return 0
      return ((cur / prev) - 1) * 100
    }

    // ── 4개 카드 구성 ───────────────────────────────────────
    function makeCard(
      id: string, pairLabel: string, description: string,
      numSym: string, denSym: string, numIdx: number, denIdx: number
    ): RatioCard {
      const nq = getQ(numSym)
      const dq = getQ(denSym)

      const nPrice = nq?.regularMarketPrice ?? 0
      const dPrice = dq?.regularMarketPrice ?? 0
      const ratio  = dPrice > 0 ? nPrice / dPrice : 0

      // 비율 변화율 ≈ 분자 변화율 − 분모 변화율
      const nChgPct = nq?.regularMarketChangePercent ?? 0
      const dChgPct = dq?.regularMarketChangePercent ?? 0
      const ratioChangePct = nChgPct - dChgPct

      const hist = ratioHistory(numIdx, denIdx)
      const c5   = change5d(hist)
      const sig  = getSignal(c5, numSym, denSym)

      return {
        id, pairLabel, description, ratio, ratioChangePct,
        change5dPct: c5,
        num: { symbol: numSym, changePercent: nChgPct },
        den: { symbol: denSym, changePercent: dChgPct },
        history: hist,
        signal: sig.label,
        signalType: sig.type,
      }
    }

    const cards: RatioCard[] = [
      makeCard('spy-tlt',    'SPY / TLT',    'Risk Appetite',  'SPY',    'TLT',    IDX.SPY, IDX.TLT),
      makeCard('qqq-dia',    'QQQ / DIA',    'Growth vs Value','QQQ',    'DIA',    IDX.QQQ, IDX.DIA),
      makeCard('btc-gold',   'BTC / GOLD',   'Digital vs Real','BTC-USD','GC=F',   IDX.BTC, IDX.GC),
      makeCard('copper-gold','COPPER / GOLD','Real Economy',   'HG=F',   'GC=F',   IDX.HG,  IDX.GC),
    ]

    return NextResponse.json<CapitalRatioData>(
      { cards, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/capital-ratio]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
