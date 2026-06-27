/**
 * 토스증권 Open API 클라이언트
 * - OAuth 2.0 Client Credentials (토큰 24시간 유효, 모듈 레벨 캐시)
 * - 현재가: /api/v1/prices (최대 200개 배치)
 * - 전일 종가: /api/v1/candles?interval=1d&count=2 (심볼별, KST 날짜 단위 캐시)
 */

import { loadPrevCloses, savePrevCloses } from './prev-close-store'

const BASE = 'https://openapi.tossinvest.com'

// ── Token cache ───────────────────────────────────────────────────────────────
let tokenCache: { value: string; expiresAt: number } | null = null
let tokenFetchPromise: Promise<string> | null = null

async function fetchNewToken(): Promise<string> {
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.TOSS_API_KEY ?? '',
      client_secret: process.env.TOSS_SECRET_KEY ?? '',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[toss] token fetch failed: ${res.status} ${body}`)
  }
  const data = await res.json()
  if (!data.access_token) throw new Error(`[toss] no access_token in response: ${JSON.stringify(data)}`)

  const expiresIn: number = data.expires_in ?? 86400
  tokenCache = { value: data.access_token, expiresAt: Date.now() + (expiresIn - 60) * 1000 }
  tokenFetchPromise = null
  return tokenCache.value
}

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value
  if (tokenFetchPromise) return tokenFetchPromise
  tokenFetchPromise = fetchNewToken()
  return tokenFetchPromise
}

// ── Stock info (이름/시장 등 참조 데이터) ──────────────────────────────────────
export interface TossStockInfo {
  symbol: string
  name: string // 한글 종목명
  englishName: string
  market: string // KOSPI, KOSDAQ, NYSE, NASDAQ 등
  currency: string // KRW, USD
}

export async function fetchTossStockInfos(
  symbols: string[]
): Promise<Map<string, TossStockInfo>> {
  const token = await getToken()
  const result = new Map<string, TossStockInfo>()

  const CHUNK = 200
  for (let i = 0; i < symbols.length; i += CHUNK) {
    const chunk = symbols.slice(i, i + CHUNK)
    const res = await fetch(`${BASE}/api/v1/stocks?symbols=${chunk.join(',')}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[toss] stocks failed: ${res.status}`)
      continue
    }
    const data = await res.json()
    for (const item of data.result ?? []) {
      result.set(item.symbol, {
        symbol: item.symbol,
        name: item.name,
        englishName: item.englishName,
        market: item.market,
        currency: item.currency,
      })
    }
  }

  return result
}

// ── Current prices ────────────────────────────────────────────────────────────
export interface TossPrice {
  symbol: string
  lastPrice: number
  timestamp: string
}

export async function fetchTossPrices(symbols: string[]): Promise<Map<string, TossPrice>> {
  const token = await getToken()
  const result = new Map<string, TossPrice>()

  // Batch up to 200 at a time
  const CHUNK = 200
  for (let i = 0; i < symbols.length; i += CHUNK) {
    const chunk = symbols.slice(i, i + CHUNK)
    const res = await fetch(`${BASE}/api/v1/prices?symbols=${chunk.join(',')}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[toss] prices failed: ${res.status}`, body.slice(0, 200))
      continue
    }
    const data = await res.json()
    for (const item of data.result ?? []) {
      result.set(item.symbol, {
        symbol: item.symbol,
        lastPrice: Number(item.lastPrice),
        timestamp: item.timestamp,
      })
    }
  }

  return result
}

// ── Previous close cache (KST date granularity) ───────────────────────────────
// key: "YYYY-MM-DD" (KST), value: symbol → prevClose
const prevCloseByDate = new Map<string, Map<string, number>>()

function kstDateString(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).split(' ')[0]
}

async function fetchOnePreviousClose(symbol: string, token: string): Promise<number> {
  // MARKET_DATA_CHART rate limit group: 429 시 Retry-After 존중하며 재시도
  const MAX_RETRIES = 4
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `${BASE}/api/v1/candles?symbol=${symbol}&interval=1d&count=2`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      )

      if (res.status === 429) {
        if (attempt === MAX_RETRIES) return 0
        const retryAfter = Number(res.headers.get('Retry-After')) || 1
        await sleep(retryAfter * 1000 + 100)
        continue
      }

      if (!res.ok) return 0
      const data = await res.json()
      const candles: { closePrice: string }[] = data.result?.candles ?? []
      if (candles.length >= 2) return Number(candles[1].closePrice)
      if (candles.length === 1) return Number(candles[0].closePrice)
      return 0
    } catch {
      if (attempt === MAX_RETRIES) return 0
      await sleep(500)
    }
  }
  return 0
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let idx = 0

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++
      results[i] = await tasks[i]()
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

export async function fetchTossPreviousCloses(symbols: string[]): Promise<Map<string, number>> {
  const today = kstDateString()
  let cache = prevCloseByDate.get(today)

  // Evict old date entries
  for (const key of prevCloseByDate.keys()) {
    if (key !== today) prevCloseByDate.delete(key)
  }

  if (!cache) {
    cache = new Map()
    prevCloseByDate.set(today, cache)
  }

  // 1) 메모리에 없는 심볼
  let missing = symbols.filter((s) => !cache!.has(s))

  // 2) Supabase 공용 저장소에서 로드 (serverless 인스턴스 간 공유, env 없으면 빈 Map)
  if (missing.length > 0) {
    const fromDb = await loadPrevCloses(today)
    if (fromDb.size > 0) {
      for (const s of missing) {
        const v = fromDb.get(s)
        if (v != null) cache!.set(s, v)
      }
      missing = symbols.filter((s) => !cache!.has(s))
    }
  }

  // 3) 아직도 없으면 토스 candles 로 조회 후 메모리 + DB 에 저장
  if (missing.length > 0) {
    const token = await getToken()
    const fetchers = missing.map((s) => () => fetchOnePreviousClose(s, token))
    // MARKET_DATA_CHART burst ~10/s. 동시성 4로 제한하여 429 최소화.
    const closes = await runWithConcurrency(fetchers, 4)

    const toSave = new Map<string, number>()
    missing.forEach((s, i) => {
      cache!.set(s, closes[i])
      if (closes[i] > 0) toSave.set(s, closes[i])
    })

    // DB 저장 (다음 인스턴스/요청이 재사용)
    await savePrevCloses(toSave, today)
  }

  return cache!
}

// ── NXT session detection ─────────────────────────────────────────────────────
// NXT: 8:00–9:00 KST (pre-market) and 15:30–20:00 KST (post-market)
// Regular: 9:00–15:30 KST
export function detectKrSession(): 'pre' | 'regular' | 'post' | 'closed' {
  const now = new Date()
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const h = kst.getHours()
  const m = kst.getMinutes()
  const minutes = h * 60 + m

  const day = kst.getDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return 'closed'

  if (minutes >= 8 * 60 && minutes < 9 * 60) return 'pre'
  if (minutes >= 9 * 60 && minutes < 15 * 60 + 30) return 'regular'
  if (minutes >= 15 * 60 + 30 && minutes < 20 * 60) return 'post'
  return 'closed'
}
