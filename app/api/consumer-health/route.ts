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

export interface HealthPoint { date: string; value: number }

export interface HealthIndicator {
  id:      string
  label:   string
  emoji:   string
  unit:    string
  current: number | null
  change:  number | null    // vs previous period
  yoy:     number | null    // YoY % change (null if not applicable)
  date:    string | null
  history: HealthPoint[]    // oldest → newest (최대 12)
  status:  'green' | 'yellow' | 'red' | 'unknown'
}

export interface ConsumerHealthData {
  sentiment:     HealthIndicator   // Stage 1: UMCSENT
  saving:        HealthIndicator   // Stage 2a: PSAVERT
  delinquency:   HealthIndicator   // Stage 2b: DRCCLACBS
  retail:        HealthIndicator   // Stage 3: RSXFS (nominal YoY)
  alertFakeBoom: boolean           // 심리🟢 + 저축🔴 + 연체🔴 = 가짜 호황
  timestamp:     number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toHistory(obs: any[], n = 12): HealthPoint[] {
  return obs.slice(0, n).reverse().map(o => ({ date: o.date, value: parseFloat(o.value) }))
}

function sentimentStatus(cur: number): 'green' | 'yellow' | 'red' {
  if (cur >= 80) return 'green'
  if (cur >= 65) return 'yellow'
  return 'red'
}

function savingStatus(cur: number): 'green' | 'yellow' | 'red' {
  // Low saving rate = financially stretched consumers
  if (cur >= 6) return 'green'
  if (cur >= 3) return 'yellow'
  return 'red'
}

function delinquencyStatus(cur: number): 'green' | 'yellow' | 'red' {
  // High delinquency = consumers under stress
  if (cur < 2.5)  return 'green'
  if (cur < 3.5)  return 'yellow'
  return 'red'
}

function retailStatus(yoy: number | null): 'green' | 'yellow' | 'red' | 'unknown' {
  if (yoy === null) return 'unknown'
  if (yoy >= 4) return 'green'
  if (yoy >= 0) return 'yellow'
  return 'red'
}

export async function GET() {
  try {
    const [sentRes, savRes, delRes, retailRes] = await Promise.allSettled([
      fredDesc('UMCSENT',   14),   // U-Mich Consumer Sentiment (monthly, index)
      fredDesc('PSAVERT',   14),   // Personal Saving Rate (monthly, %)
      fredDesc('DRCCLACBS', 10),   // Credit Card Delinquency Rate (quarterly, %)
      fredDesc('RSXFS',     15),   // Retail Sales ex-food services (monthly, millions $)
    ])

    const sentObs   = sentRes.status   === 'fulfilled' ? sentRes.value   : []
    const savObs    = savRes.status    === 'fulfilled' ? savRes.value    : []
    const delObs    = delRes.status    === 'fulfilled' ? delRes.value    : []
    const retailObs = retailRes.status === 'fulfilled' ? retailRes.value : []

    // ── Sentiment ──────────────────────────────────────────
    const sentCur    = sentObs.length  ? parseFloat(sentObs[0].value)  : null
    const sentChange = (sentObs.length >= 2)
      ? sentCur! - parseFloat(sentObs[1].value)
      : null

    // ── Saving ─────────────────────────────────────────────
    const savCur    = savObs.length   ? parseFloat(savObs[0].value)   : null
    const savChange = (savObs.length >= 2)
      ? savCur! - parseFloat(savObs[1].value)
      : null

    // ── Delinquency (quarterly) ────────────────────────────
    const delCur    = delObs.length   ? parseFloat(delObs[0].value)   : null
    const delChange = (delObs.length >= 2)
      ? delCur! - parseFloat(delObs[1].value)
      : null

    // ── Retail — YoY % (obs[0] vs obs[12]) ────────────────
    const retailCur = retailObs.length ? parseFloat(retailObs[0].value) : null
    const retailYoy = (retailObs.length >= 13)
      ? (parseFloat(retailObs[0].value) / parseFloat(retailObs[12].value) - 1) * 100
      : null
    const retailChange = (retailObs.length >= 2)
      ? retailCur! - parseFloat(retailObs[1].value)
      : null

    // ── Status ─────────────────────────────────────────────
    const sentStatus = sentCur    !== null ? sentimentStatus(sentCur)       : 'unknown' as const
    const savStatus  = savCur     !== null ? savingStatus(savCur)            : 'unknown' as const
    const delStatus  = delCur     !== null ? delinquencyStatus(delCur)       : 'unknown' as const
    const retStatus  = retailStatus(retailYoy)

    // 가짜 호황: 심리 GOOD + 저축 BAD + 연체 BAD
    const alertFakeBoom =
      sentStatus === 'green' &&
      savStatus  === 'red'   &&
      delStatus  === 'red'

    const sentiment: HealthIndicator = {
      id: 'sentiment', label: '소비자 심리지수 (UMich)', emoji: '🧠',
      unit: '포인트',
      current: sentCur, change: sentChange, yoy: null,
      date: sentObs[0]?.date ?? null,
      history: toHistory(sentObs),
      status: sentStatus,
    }

    const saving: HealthIndicator = {
      id: 'saving', label: '개인 저축률', emoji: '🏦',
      unit: '%',
      current: savCur, change: savChange, yoy: null,
      date: savObs[0]?.date ?? null,
      history: toHistory(savObs),
      status: savStatus,
    }

    const delinquency: HealthIndicator = {
      id: 'delinquency', label: '신용카드 연체율', emoji: '💳',
      unit: '%',
      current: delCur, change: delChange, yoy: null,
      date: delObs[0]?.date ?? null,
      history: toHistory(delObs),
      status: delStatus,
    }

    const retail: HealthIndicator = {
      id: 'retail', label: '소매판매 (명목 YoY)', emoji: '🛍️',
      unit: '%',
      current: retailYoy, change: retailChange, yoy: retailYoy,
      date: retailObs[0]?.date ?? null,
      history: toHistory(retailObs),
      status: retStatus,
    }

    return NextResponse.json<ConsumerHealthData>(
      { sentiment, saving, delinquency, retail, alertFakeBoom, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/consumer-health]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
