import { NextResponse } from 'next/server'
import { fredDesc }    from '@/lib/fred'

export const dynamic    = 'force-dynamic'
export const fetchCache = 'default-no-store'  // next.revalidate=86400 가 살아있어야 Data Cache에 저장됨
export const maxDuration = 60   // Vercel 함수 최대 실행 시간 (초)

/**
 * 모니터링 탭에 사용되는 모든 FRED 시리즈를 사전 캐싱.
 * Vercel Cron이 매일 00:30 UTC (09:30 KST)에 호출.
 * 400ms 간격으로 순차 실행 → FRED 속도제한(120/분) 안전하게 회피.
 * unstable_cache가 이미 캐시된 시리즈는 즉시 반환 (FRED 미호출).
 */
const SERIES: [string, number][] = [
  // liquidity-flow
  ['RRPONTSYD',        65],
  ['SOFR',             65],
  // mmf-tips
  ['WRMFNS',           14],
  ['DFII5',             5],
  ['DFII10',            5],
  // employment-domino
  ['JTSJOL',           15],
  ['TEMPHELPS',        15],
  ['ICSA',             14],
  ['PAYEMS',           15],
  ['SAHMREALTIME',     14],
  // consumer-health
  ['UMCSENT',          14],
  ['PSAVERT',          14],
  ['DRCCLACBS',        10],
  ['RSXFS',            15],
  // inflation
  ['CPIAUCSL',         25],
  ['CPILFESL',         25],
  ['WPSFD49207',       25],
  ['PCEPI',            25],
  ['PCEPILFE',         25],
  ['CES0500000003',    25],
  // gdpnow
  ['GDPNOW',            5],
  ['WEI',               2],
  // plumbing
  ['WALCL',            10],
  ['IORB',             10],
  ['STLFSI4',          10],
  ['BAMLH0A0HYM2',     10],  // 구 BAMLH0A3HYCSOAS 대체 — US HY OAS 스프레드
  ['DRSDCILM',         10],
]

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let warmed = 0
  let failed = 0

  for (const [series, limit] of SERIES) {
    try {
      await fredDesc(series, limit)
      warmed++
    } catch {
      failed++
    }
    await sleep(400)   // 400ms 간격 = 2.5 req/sec < FRED 한도(2/sec on avg)
  }

  return NextResponse.json({
    ok: true,
    warmed,
    failed,
    total: SERIES.length,
    at: new Date().toISOString(),
  })
}
