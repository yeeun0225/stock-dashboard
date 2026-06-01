import { NextResponse } from 'next/server'
import { fredDesc } from '@/lib/fred'

export const dynamic    = 'force-dynamic'
export const fetchCache = 'default-no-store'

export interface DominoPoint { date: string; value: number }

export interface DominoStage {
  id:      string
  stage:   number
  label:   string
  emoji:   string
  unit:    string
  note:    string              // 1-line interpretation hint
  current: number | null
  change:  number | null
  date:    string | null
  history: DominoPoint[]      // oldest → newest (최대 12)
  status:  'green' | 'yellow' | 'red' | 'unknown'
}

export interface EmploymentDominoData {
  stages:    DominoStage[]
  timestamp: number
}

// obs desc-ordered → 12-point history oldest → newest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function levelHistory(obs: any[], n = 12): DominoPoint[] {
  return obs.slice(0, n).reverse().map(o => ({ date: o.date, value: parseFloat(o.value) }))
}

// NFP: compute MoM changes (level diff) oldest → newest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nfpChanges(obs: any[], n = 12): DominoPoint[] {
  const results: DominoPoint[] = []
  for (let i = 0; i < n && i + 1 < obs.length; i++) {
    results.push({
      date:  obs[i].date,
      value: parseFloat(obs[i].value) - parseFloat(obs[i + 1].value),
    })
  }
  return results.reverse()   // oldest → newest
}

// ── Status helpers ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function joltsStatus(obs: any[]): 'green' | 'yellow' | 'red' | 'unknown' {
  if (!obs.length) return 'unknown'
  const cur = parseFloat(obs[0].value)            // thousands of jobs
  if (cur >= 7500) return 'green'
  if (cur >= 6000) return 'yellow'
  return 'red'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tempStatus(obs: any[]): 'green' | 'yellow' | 'red' | 'unknown' {
  if (obs.length < 13) return obs.length < 2 ? 'unknown' : 'yellow'
  const cur     = parseFloat(obs[0].value)
  const yearAgo = parseFloat(obs[12].value)
  const yoy     = (cur / yearAgo - 1) * 100
  if (yoy > -1)  return 'green'
  if (yoy > -5)  return 'yellow'
  return 'red'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function icsaStatus(obs: any[]): 'green' | 'yellow' | 'red' | 'unknown' {
  if (!obs.length) return 'unknown'
  const cur = parseFloat(obs[0].value)            // thousands
  if (cur < 220) return 'green'
  if (cur < 260) return 'yellow'
  return 'red'
}

function nfpStatus(change: number | null): 'green' | 'yellow' | 'red' | 'unknown' {
  if (change === null) return 'unknown'
  if (change > 150) return 'green'
  if (change > 0)   return 'yellow'
  return 'red'
}

function sahmStatus(cur: number | null): 'green' | 'yellow' | 'red' | 'unknown' {
  if (cur === null) return 'unknown'
  if (cur < 0.3)   return 'green'
  if (cur < 0.5)   return 'yellow'
  return 'red'
}

export async function GET() {
  try {
    // 전역 FRED 요청 타임테이블 기준: 이 라우트는 t=100ms~900ms
    const d = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
    const [joltsRes, tempRes, icsaRes, payemsRes, sahmRes] = await Promise.allSettled([
      d(100).then(() => fredDesc('JTSJOL',       15)),
      d(300).then(() => fredDesc('TEMPHELPS',    15)),
      d(500).then(() => fredDesc('ICSA',         14)),
      d(700).then(() => fredDesc('PAYEMS',       15)),
      d(900).then(() => fredDesc('SAHMREALTIME', 14)),
    ])

    const jolts  = joltsRes.status  === 'fulfilled' ? joltsRes.value  : []
    const temp   = tempRes.status   === 'fulfilled' ? tempRes.value   : []
    const icsa   = icsaRes.status   === 'fulfilled' ? icsaRes.value   : []
    const payems = payemsRes.status === 'fulfilled' ? payemsRes.value : []
    const sahm   = sahmRes.status   === 'fulfilled' ? sahmRes.value   : []

    // JOLTS
    const joltsCur    = jolts.length  ? parseFloat(jolts[0].value)  : null
    const joltsChange = (jolts.length >= 2)
      ? joltsCur! - parseFloat(jolts[1].value)
      : null

    // Temp help
    const tempCur    = temp.length   ? parseFloat(temp[0].value)    : null
    const tempChange = (temp.length >= 2)
      ? tempCur! - parseFloat(temp[1].value)
      : null

    // ICSA
    const icsaCur    = icsa.length   ? parseFloat(icsa[0].value)    : null
    const icsaChange = (icsa.length >= 2)
      ? icsaCur! - parseFloat(icsa[1].value)
      : null

    // NFP — show MoM change as headline, history as MoM changes
    const nfpChange = (payems.length >= 2)
      ? parseFloat(payems[0].value) - parseFloat(payems[1].value)
      : null

    // Sahm
    const sahmCur    = sahm.length   ? parseFloat(sahm[0].value)    : null
    const sahmChange = (sahm.length >= 2)
      ? sahmCur! - parseFloat(sahm[1].value)
      : null

    const stages: DominoStage[] = [
      {
        id: 'jolts', stage: 1, label: '구인건수 (JOLTS)', emoji: '📋',
        unit: '천 건', note: '구인 감소 → 기업 채용 동결 신호',
        current: joltsCur, change: joltsChange,
        date: jolts[0]?.date ?? null,
        history: levelHistory(jolts),
        status: joltsStatus(jolts),
      },
      {
        id: 'temp', stage: 2, label: '임시직 고용', emoji: '⏱️',
        unit: '천 명', note: 'NFP보다 1~3개월 선행하는 경기 탐지기',
        current: tempCur, change: tempChange,
        date: temp[0]?.date ?? null,
        history: levelHistory(temp),
        status: tempStatus(temp),
      },
      {
        id: 'icsa', stage: 3, label: '신규 실업수당', emoji: '📉',
        unit: '천 건', note: '증가폭 +15% → 레드 경보 (서킷브레이커)',
        current: icsaCur, change: icsaChange,
        date: icsa[0]?.date ?? null,
        history: levelHistory(icsa),
        status: icsaStatus(icsa),
      },
      {
        id: 'nfp', stage: 4, label: 'NFP 비농업 고용', emoji: '👷',
        unit: '천 명 MoM', note: '+150K 이상 유지 시 고용 건전',
        current: nfpChange, change: null,
        date: payems[0]?.date ?? null,
        history: nfpChanges(payems),
        status: nfpStatus(nfpChange),
      },
      {
        id: 'sahm', stage: 5, label: '샴룰 지수', emoji: '🚨',
        unit: '%p', note: '0.50 돌파 = 경기침체 공식 신호',
        current: sahmCur, change: sahmChange,
        date: sahm[0]?.date ?? null,
        history: levelHistory(sahm),
        status: sahmStatus(sahmCur),
      },
    ]

    return NextResponse.json<EmploymentDominoData>(
      { stages, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/employment-domino]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
