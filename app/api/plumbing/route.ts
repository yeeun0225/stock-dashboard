import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { fredDesc } from '@/lib/fred'

export const dynamic    = 'force-dynamic'
export const fetchCache = 'default-no-store'
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

interface FredPoint { value: number; prev: number; change: number; date: string }

async function toPoint(obs: Awaited<ReturnType<typeof fredDesc>>): Promise<FredPoint | null> {
  if (obs.length < 2) return null
  const value = parseFloat(obs[0].value)
  const prev  = parseFloat(obs[1].value)
  return { value, prev, change: value - prev, date: obs[0].date }
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

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
  hySpread:      FredPoint | null   // BAMLH0A0HYM2 (%)
  loanStandards: FredPoint | null   // DRSDCILM — 대출 기준 강화 net%

  timestamp: number
}

export async function GET() {
  try {
    // ── FRED 직렬 요청 (글로벌 타임테이블 준수) ─────────────────────────────
    // limit=65 for RRPONTSYD/SOFR → 워밍크론(limit=65) + liquidity-flow와 캐시키 공유
    // BAMLH0A0HYM2: 구 BAMLH0A3HYCSOAS의 대체 시리즈 (US HY 스프레드)
    // 각 시리즈에 delay를 줘서 cold-cache 상황에서도 FRED 속도제한 준수
    const [faObs, onrrpObs, sofrObs, iorbObs, fsiObs, hyObs, loanObs] =
      await Promise.all([
        fredDesc('WALCL',          10).catch(() => null),                   // t ≈ 0ms
        fredDesc('RRPONTSYD',      65).catch(() => null),                   // t ≈ 0ms  — 캐시공유: 워밍크론·liquidity-flow
        fredDesc('SOFR',           65).catch(() => null),                   // t ≈ 0ms  — 캐시공유: 워밍크론·liquidity-flow
        sleep(200).then(() => fredDesc('IORB',          10)).catch(() => null), // t = 200ms
        sleep(400).then(() => fredDesc('STLFSI4',       10)).catch(() => null), // t = 400ms
        sleep(600).then(() => fredDesc('BAMLH0A0HYM2',  10)).catch(() => null), // t = 600ms  — 워밍크론에도 추가됨
        sleep(800).then(() => fredDesc('DRSDCILM',       10)).catch(() => null), // t = 800ms
      ])

    const [fedAssets, onrrp, sofr, iorb, fsi, hySpread, loanStandards] =
      await Promise.all([
        faObs   ? toPoint(faObs)   : Promise.resolve(null),
        onrrpObs? toPoint(onrrpObs): Promise.resolve(null),
        sofrObs ? toPoint(sofrObs) : Promise.resolve(null),
        iorbObs ? toPoint(iorbObs) : Promise.resolve(null),
        fsiObs  ? toPoint(fsiObs)  : Promise.resolve(null),
        hyObs   ? toPoint(hyObs)   : Promise.resolve(null),
        loanObs ? toPoint(loanObs) : Promise.resolve(null),
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
