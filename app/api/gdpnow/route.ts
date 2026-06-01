import { NextResponse } from 'next/server'
import { fredDesc } from '@/lib/fred'

export const dynamic = 'force-dynamic'

export interface GDPNowData {
  current:   number | null   // % annualized (SAAR)
  quarter:   string | null   // e.g. "2nd quarter of 2026"
  date:      string | null   // last update date
  source:    'gdpnow' | 'wei' | null
  timestamp: number
}

function dateToQuarter(dateStr: string): string {
  const month = parseInt(dateStr.slice(5, 7))
  const year  = dateStr.slice(0, 4)
  const ord   = month === 1 ? '1st' : month === 4 ? '2nd' : month === 7 ? '3rd' : '4th'
  return `${ord} quarter of ${year}`
}

export async function GET() {
  const empty: GDPNowData = { current: null, quarter: null, date: null, source: null, timestamp: Date.now() }

  // ── 1) FRED GDPNOW 시리즈 (Atlanta Fed GDPNow 공식 경로) ──
  try {
    const obs = await fredDesc('GDPNOW', 5)
    if (obs.length) {
      return NextResponse.json<GDPNowData>(
        {
          current:   parseFloat(obs[0].value),
          quarter:   dateToQuarter(obs[0].date),
          date:      obs[0].date,
          source:    'gdpnow',
          timestamp: Date.now(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }
  } catch { /* fall through */ }

  // ── 2) 폴백: FRED WEI (NY Fed 주간 경기지수) ──────────────
  try {
    const obs = await fredDesc('WEI', 2)
    if (obs.length) {
      return NextResponse.json<GDPNowData>(
        {
          current:   parseFloat(obs[0].value),
          quarter:   null,
          date:      obs[0].date,
          source:    'wei',
          timestamp: Date.now(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }
  } catch { /* fall through */ }

  return NextResponse.json<GDPNowData>(empty, { headers: { 'Cache-Control': 'no-store' } })
}
