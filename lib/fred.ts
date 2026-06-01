const FRED_KEY = process.env.FRED_API_KEY
const BASE     = 'https://api.stlouisfed.org/fred/series/observations'

export interface FredObs { date: string; value: string }

/**
 * FRED 시리즈 관측값을 가져옵니다.
 *
 * fetch 레벨 캐싱(next.revalidate) 사용:
 *   - Vercel Data Cache — 서버리스 함수 인스턴스 간 공유, 24시간 TTL
 *   - unstable_cache(인메모리 LRU)와 달리 인스턴스마다 캐시가 독립적이지 않음
 *   - 에러(4xx/5xx/빈 데이터)는 캐싱되지 않으므로 다음 요청에서 자동 재시도
 *
 * 호출 측 라우트에 반드시 `export const fetchCache = 'default-no-store'` 추가:
 *   - force-dynamic의 암묵적 fetchCache='force-no-store' 를 override해야 함
 *   - 명시적 next.revalidate 가 살아남도록
 */
export async function fredDesc(series: string, limit: number): Promise<FredObs[]> {
  const url = `${BASE}?series_id=${series}&api_key=${FRED_KEY}&sort_order=desc&limit=${limit}&file_type=json`
  const res = await fetch(url, {
    next: { revalidate: 86400 },  // 24시간 — Vercel 공유 Data Cache에 저장
  })
  if (!res.ok) throw new Error(`FRED ${res.status}: ${series}`)
  const data = await res.json()
  const obs  = ((data.observations ?? []) as FredObs[]).filter(o => o.value !== '.')
  if (!obs.length) throw new Error(`FRED ${series}: no observations`)
  return obs
}
