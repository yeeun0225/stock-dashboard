import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const FRED_KEY  = process.env.FRED_API_KEY
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

// FRED에서 최신 2개 관측치 가져오기
async function fredFetch(series: string, limit = 10) {
  const url = `${FRED_BASE}?series_id=${series}&api_key=${FRED_KEY}&sort_order=desc&limit=${limit}&file_type=json`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`FRED ${series} ${res.status}`)
  const data = await res.json()
  // '.' 은 결측값
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.observations as any[]).filter(o => o.value !== '.')
}

interface FredPoint { value: number; prev: number; change: number; date: string }

async function fredPoint(series: string): Promise<FredPoint | null> {
  try {
    const obs = await fredFetch(series, 10)
    if (obs.length < 2) return null
    const value = parseFloat(obs[0].value)
    const prev  = parseFloat(obs[1].value)
    return { value, prev, change: value - prev, date: obs[0].date }
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────

export interface PlumbingPanel {
  // Panel 1: 중앙은행 유동성
  fedAssets:     FredPoint | null   // WALCL  (백만 달러 → 조 달러로 표시)
  onrrp:         FredPoint | null   // RRPONTSYD (십억 달러)

  // Panel 2: 단기자금시장
  sofr:          FredPoint | null   // SOFR (%)
  iorb:          FredPoint | null   // IORB (%)

  // Panel 3: 글로벌 달러·환율
  dxy:           { value: number; change: number; changePercent: number } | null
  usdjpy:        { value: number; change: number; changePercent: number } | null
  fsi:           FredPoint | null   // STLFSI4 — 금융스트레스 지수

  // Panel 4: 신용·실물 리스크
  hySpread:      FredPoint | null   // BAMLH0A3HYCSOAS (%)
  loanStandards: FredPoint | null   // DRSDCILM — 대출 기준 강화 net%

  timestamp: number
}

export async function GET() {
  try {
    // FRED 병렬 요청
    const [fedAssets, onrrp, sofr, iorb, fsi, hySpread, loanStandards] =
      await Promise.all([
        fredPoint('WALCL'),           // Fed 자산 (백만 $)
        fredPoint('RRPONTSYD'),       // ON RRP (십억 $)
        fredPoint('SOFR'),            // SOFR %
        fredPoint('IORB'),            // IORB %
        fredPoint('STLFSI4'),         // 금융스트레스
        fredPoint('BAMLH0A3HYCSOAS'), // HY 스프레드
        fredPoint('DRSDCILM'),        // 대출기준 강화
      ])

    // Yahoo Finance — DXY, USD/JPY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fxQuotes = await yf.quote(['DX-Y.NYB', 'JPY=X'], {}, { validateResult: false }) as any[]
    const fxMap = new Map<string, any>()
    for (const q of fxQuotes) if (q?.symbol) fxMap.set(q.symbol, q)

    const dxyQ = fxMap.get('DX-Y.NYB')
    const jpyQ = fxMap.get('JPY=X')

    const dxy = dxyQ ? {
      value:         dxyQ.regularMarketPrice        ?? 0,
      change:        dxyQ.regularMarketChange        ?? 0,
      changePercent: dxyQ.regularMarketChangePercent ?? 0,
    } : null

    // JPY=X 는 JPY per 1 USD → 그대로 USD/JPY
    const usdjpy = jpyQ ? {
      value:         jpyQ.regularMarketPrice        ?? 0,
      change:        jpyQ.regularMarketChange        ?? 0,
      changePercent: jpyQ.regularMarketChangePercent ?? 0,
    } : null

    const body: PlumbingPanel = {
      fedAssets, onrrp,
      sofr, iorb,
      dxy, usdjpy, fsi,
      hySpread, loanStandards,
      timestamp: Date.now(),
    }

    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[/api/plumbing]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
