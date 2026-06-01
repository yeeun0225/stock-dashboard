import { NextResponse } from 'next/server'
import { fredDesc } from '@/lib/fred'

export const dynamic    = 'force-dynamic'
export const fetchCache = 'default-no-store'

// obs는 desc 정렬 — obs[0]=최신, obs[12]=12개월 전
function computeYoY(
  obs: { date: string; value: string }[],
  n = 6
): { date: string; yoy: number }[] {
  const results: { date: string; yoy: number }[] = []
  for (let i = 0; i < n; i++) {
    if (!obs[i] || !obs[i + 12]) break
    const cur  = parseFloat(obs[i].value)
    const prev = parseFloat(obs[i + 12].value)
    if (cur > 0 && prev > 0) {
      results.push({ date: obs[i].date, yoy: (cur / prev - 1) * 100 })
    }
  }
  return results.reverse()   // oldest → newest
}

export interface InflationCell { date: string; yoy: number }

export interface InflationRow {
  id:     string
  label:  string
  emoji:  string
  cells:  InflationCell[]    // oldest → newest (최대 6개월)
  latest: number
  trend:  'up' | 'down' | 'flat'
}

export interface InflationData {
  rows:      InflationRow[]
  timestamp: number
}

const SERIES = [
  { id: 'cpi',     series: 'CPIAUCSL',      label: '헤드라인 CPI', emoji: '🛒' },
  { id: 'corecpi', series: 'CPILFESL',      label: '근원 CPI',     emoji: '🔧' },
  { id: 'ppi',     series: 'WPSFD49207',    label: 'PPI 최종수요', emoji: '🏭' },
  { id: 'pce',     series: 'PCEPI',         label: 'PCE',          emoji: '💳' },
  { id: 'corepce', series: 'PCEPILFE',      label: '근원 PCE',     emoji: '📊' },
  { id: 'wages',   series: 'CES0500000003', label: '평균 시간급',  emoji: '💰' },
]

export async function GET() {
  try {
    // 25건 = 6개월 YoY(최소 18건) + '.' 필터링 후 버퍼
    // 전역 FRED 요청 타임테이블 기준: 이 라우트는 t=200ms~1200ms
    const DELAYS = [200, 400, 600, 800, 1000, 1200]
    const d = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
    const allObs = await Promise.allSettled(
      SERIES.map(({ series }, i) => d(DELAYS[i]).then(() => fredDesc(series, 25)))
    )

    const rows: InflationRow[] = SERIES.map(({ id, label, emoji }, i) => {
      const res = allObs[i]
      if (res.status !== 'fulfilled' || !res.value.length) {
        return { id, label, emoji, cells: [], latest: 0, trend: 'flat' as const }
      }

      const cells  = computeYoY(res.value, 6)
      const latest = cells.length ? cells[cells.length - 1].yoy : 0
      const prev   = cells.length >= 2 ? cells[cells.length - 2].yoy : latest
      const trend: InflationRow['trend'] =
        latest > prev + 0.1 ? 'up' : latest < prev - 0.1 ? 'down' : 'flat'

      return { id, label, emoji, cells, latest, trend }
    })

    return NextResponse.json<InflationData>(
      { rows, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/inflation]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
