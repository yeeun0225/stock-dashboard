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
  return (data.observations as any[]).filter(o => o.value !== '.')
}

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
    const [mmfObs, t5Obs, t10Obs] = await Promise.all([
      fredDesc('WRMFNS', 14),    // MMF 총 자산 (주간, 십억$)
      fredDesc('DFII5',   5),    // 5Y TIPS 실질금리 (일간, %)
      fredDesc('DFII10',  5),    // 10Y TIPS 실질금리 (일간, %)
    ])

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
