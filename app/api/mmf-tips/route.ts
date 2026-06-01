import { NextResponse } from 'next/server'
import { fredDesc } from '@/lib/fred'

export const dynamic    = 'force-dynamic'
export const fetchCache = 'default-no-store'

export interface MmfPoint  { date: string; value: number }
export interface TipsPoint { label: string; value: number; change: number; date: string }

export interface MmfTipsData {
  mmf: {
    current:     number   // 현재 잔고 (십억 $)
    change1w:    number   // 1주 변화
    change4w:    number   // 4주 변화
    history:     MmfPoint[]   // 최근 12주 (스파크라인)
    date:        string
  } | null
  tips: TipsPoint[]       // 5Y, 10Y 실질금리
  timestamp: number
}

export async function GET() {
  try {
    // 전역 FRED 요청 타임테이블 기준: 이 라우트는 t=50ms, t=250ms, t=450ms
    const d = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
    const [mmfRes, t5Res, t10Res] = await Promise.allSettled([
      d(50).then(()  => fredDesc('WRMFNS', 14)),
      d(250).then(() => fredDesc('DFII5',  5)),
      d(450).then(() => fredDesc('DFII10', 5)),
    ])
    const mmfObs = mmfRes.status === 'fulfilled' ? mmfRes.value : []
    const t5Obs  = t5Res.status  === 'fulfilled' ? t5Res.value  : []
    const t10Obs = t10Res.status === 'fulfilled' ? t10Res.value : []

    // ── MMF ──────────────────────────────────────────────
    let mmf: MmfTipsData['mmf'] = null
    if (mmfObs.length >= 2) {
      const cur   = parseFloat(mmfObs[0].value)
      const w1    = parseFloat(mmfObs[1].value)
      const w4    = mmfObs[4] ? parseFloat(mmfObs[4].value) : cur
      mmf = {
        current:  cur,
        change1w: cur - w1,
        change4w: cur - w4,
        history:  mmfObs.slice(0, 12).reverse().map(o => ({ date: o.date, value: parseFloat(o.value) })),
        date:     mmfObs[0].date,
      }
    }

    // ── TIPS 실질금리 ────────────────────────────────────
    function toTips(obs: typeof t5Obs, label: string): TipsPoint | null {
      if (!obs.length) return null
      const v0 = parseFloat(obs[0].value)
      const v1 = obs[1] ? parseFloat(obs[1].value) : v0
      return { label, value: v0, change: v0 - v1, date: obs[0].date }
    }

    const tips = [toTips(t5Obs, '5Y'), toTips(t10Obs, '10Y')].filter(Boolean) as TipsPoint[]

    return NextResponse.json<MmfTipsData>(
      { mmf, tips, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/mmf-tips]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
