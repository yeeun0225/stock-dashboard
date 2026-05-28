import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FRED_KEY = process.env.FRED_API_KEY
const BASE     = 'https://api.stlouisfed.org/fred/series/observations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fredDesc(series: string, limit: number): Promise<any[]> {
  const url = `${BASE}?series_id=${series}&api_key=${FRED_KEY}&sort_order=desc&limit=${limit}&file_type=json`
  const res  = await fetch(url, { cache: 'no-store' })
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data.observations ?? []) as any[]).filter(o => o.value !== '.')
}

export interface LiqFlowPoint { date: string; value: number }

export interface FlowSeries {
  current:  number
  change1d: number
  history:  LiqFlowPoint[]   // oldest → newest (최대 60일)
  date:     string
}

export interface LiquidityFlowData {
  rrp:       FlowSeries | null   // ON RRP 잔액 (십억 USD)
  sofr:      FlowSeries | null   // SOFR 금리 (%)
  timestamp: number
}

export async function GET() {
  try {
    // Promise.allSettled — 한 쪽 실패 시 나머지는 정상 반환
    const [rrpRes, sofrRes] = await Promise.allSettled([
      fredDesc('RRPONTSYD', 65),   // ON Reverse Repo (daily, billions)
      fredDesc('SOFR',      65),   // SOFR rate (daily, %)
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function toSeries(obs: any[]): FlowSeries | null {
      if (!obs.length) return null
      const current  = parseFloat(obs[0].value)
      const change1d = obs[1] ? current - parseFloat(obs[1].value) : 0
      const history  = obs.slice(0, 60).reverse()
        .map(o => ({ date: o.date, value: parseFloat(o.value) }))
      return { current, change1d, history, date: obs[0].date }
    }

    const rrpObs  = rrpRes.status  === 'fulfilled' ? rrpRes.value  : []
    const sofrObs = sofrRes.status === 'fulfilled' ? sofrRes.value : []

    return NextResponse.json<LiquidityFlowData>(
      { rrp: toSeries(rrpObs), sofr: toSeries(sofrObs), timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/liquidity-flow]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
