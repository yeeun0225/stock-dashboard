import { NextResponse } from 'next/server'
import { fredDesc } from '@/lib/fred'

export const dynamic    = 'force-dynamic'
export const fetchCache = 'default-no-store'  // force-dynamic의 force-no-store를 override → next.revalidate 허용

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
    // 전역 FRED 요청 타임테이블 기준: 이 라우트는 t=0ms, t=200ms
    const d = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
    const [rrpRes, sofrRes] = await Promise.allSettled([
      fredDesc('RRPONTSYD', 65),
      d(200).then(() => fredDesc('SOFR', 65)),
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
