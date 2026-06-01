import { unstable_cache } from 'next/cache'

const FRED_KEY = process.env.FRED_API_KEY
const BASE     = 'https://api.stlouisfed.org/fred/series/observations'

export interface FredObs { date: string; value: string }

/**
 * Fetches FRED series observations — throws on error/empty so that
 * unstable_cache does NOT cache failures (only successes are persisted).
 */
async function fetchSeries(series: string, limit: number): Promise<FredObs[]> {
  const url = `${BASE}?series_id=${series}&api_key=${FRED_KEY}&sort_order=desc&limit=${limit}&file_type=json`
  const res  = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`FRED ${res.status}: ${series}`)
  const data = await res.json()
  const obs  = ((data.observations ?? []) as FredObs[]).filter(o => o.value !== '.')
  if (!obs.length) throw new Error(`FRED ${series}: no observations`)
  return obs
}

/**
 * Cached wrapper — successful responses are stored for 30 minutes.
 * Errors are NOT cached, so rate-limited/failed calls retry on next request.
 * Arguments (series, limit) are included in the cache key automatically.
 */
export const fredDesc = unstable_cache(
  fetchSeries,
  ['fred-obs'],
  { revalidate: 86400 },  // 24시간 캐시 — FRED는 일별/주별/월별 발표, 매일 크론잡이 갱신
)
