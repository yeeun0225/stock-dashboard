import YahooFinance from 'yahoo-finance2'
import type { MarketData, FearGreedData, QuoteData } from './types'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const SYMBOLS = [
  '^KS11', '^KQ11', '^IXIC', '^GSPC', '^DJI',
  'USDKRW=X', 'JPYKRW=X', 'CNYKRW=X',
  'GC=F', 'SI=F', 'HG=F', 'LIT',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuote(q: any, fallbackSymbol: string): QuoteData {
  return {
    symbol:        q?.symbol                     ?? fallbackSymbol,
    price:         q?.regularMarketPrice          ?? 0,
    change:        q?.regularMarketChange          ?? 0,
    changePercent: q?.regularMarketChangePercent   ?? 0,
    prevClose:     q?.regularMarketPreviousClose   ?? 0,
  }
}

// ── FRED 폴백: Yahoo Finance가 0을 반환할 때만 사용 ──────────────
// 환율 계산:
//   USD/KRW = DEXKOUS (KRW per USD, ~1350)
//   JPY/KRW = DEXKOUS / DEXJPUS  (KRW per JPY, ~9)
//   CNY/KRW = DEXKOUS / DEXCHUS  (KRW per CNY, ~187)

const FRED_KEY  = process.env.FRED_API_KEY
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

interface FredObs { value: number; prev: number }

async function fredFX(series: string): Promise<FredObs | null> {
  if (!FRED_KEY) return null
  try {
    const url = `${FRED_BASE}?series_id=${series}&api_key=${FRED_KEY}&sort_order=desc&limit=5&file_type=json`
    const res  = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obs = ((data.observations ?? []) as any[]).filter((o: { value: string }) => o.value !== '.')
    if (obs.length < 2) return null
    return { value: parseFloat(obs[0].value), prev: parseFloat(obs[1].value) }
  } catch (err) {
    console.error(`[fredFX] ${series}:`, err)
    return null
  }
}

function fredToQuote(symbol: string, obs: FredObs): QuoteData {
  const change        = obs.value - obs.prev
  const changePercent = obs.prev > 0 ? (change / obs.prev) * 100 : 0
  return { symbol, price: obs.value, change, changePercent, prevClose: obs.prev }
}

export async function fetchMarketData(): Promise<MarketData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (await yf.quote(SYMBOLS, {}, { validateResult: false })) as any[]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = new Map<string, any>()
    for (const r of results) if (r?.symbol) q.set(r.symbol, r)

    // ── Yahoo Finance FX 결과 확인 ─────────────────────────────
    let usdkrw = toQuote(q.get('USDKRW=X'), 'USDKRW=X')
    let jpykrw  = toQuote(q.get('JPYKRW=X'),  'JPYKRW=X')
    let cnykrw  = toQuote(q.get('CNYKRW=X'),  'CNYKRW=X')

    // Yahoo Finance가 0을 반환하면 FRED로 폴백
    // (FRED는 영업일 기준 일간 업데이트 — 정확도는 낮지만 빈칸보단 낫다)
    if (!usdkrw.price || !jpykrw.price || !cnykrw.price) {
      const [kous, jpus, chus] = await Promise.all([
        fredFX('DEXKOUS'),   // KRW per USD
        fredFX('DEXJPUS'),   // JPY per USD
        fredFX('DEXCHUS'),   // CNY per USD
      ])

      if (!usdkrw.price && kous) {
        usdkrw = fredToQuote('USDKRW=X', kous)
      }
      if (!jpykrw.price && kous && jpus && jpus.value > 0 && jpus.prev > 0) {
        jpykrw = fredToQuote('JPYKRW=X', {
          value: kous.value / jpus.value,
          prev:  kous.prev  / jpus.prev,
        })
      }
      if (!cnykrw.price && kous && chus && chus.value > 0 && chus.prev > 0) {
        cnykrw = fredToQuote('CNYKRW=X', {
          value: kous.value / chus.value,
          prev:  kous.prev  / chus.prev,
        })
      }
    }

    return {
      indices: {
        kospi:  toQuote(q.get('^KS11'), '^KS11'),
        kosdaq: toQuote(q.get('^KQ11'), '^KQ11'),
        nasdaq: toQuote(q.get('^IXIC'), '^IXIC'),
        sp500:  toQuote(q.get('^GSPC'), '^GSPC'),
        dow:    toQuote(q.get('^DJI'),  '^DJI'),
      },
      fx: { usdkrw, jpykrw, cnykrw },
      commodities: {
        gold:    toQuote(q.get('GC=F'), 'GC=F'),
        silver:  toQuote(q.get('SI=F'), 'SI=F'),
        copper:  toQuote(q.get('HG=F'), 'HG=F'),
        lithium: toQuote(q.get('LIT'),  'LIT'),
      },
      timestamp: Date.now(),
    }
  } catch (err) {
    console.error('[fetchMarketData]', err)
    return null
  }
}

/**
 * 공포탐욕지수 — Yahoo Finance 실시간 데이터로 직접 계산
 *
 * 구성 지표 (CNN과 동일한 방향성):
 *   - VIX 변동성 (55%) : VIX 낮을수록 탐욕, 높을수록 공포
 *   - SPY vs 200일 SMA (45%) : 이격도가 클수록 탐욕, 음수면 공포
 *
 * 점수 구간: 0-24 Extreme Fear · 25-44 Fear · 45-54 Neutral
 *            55-74 Greed · 75-100 Extreme Greed
 */
export async function fetchFearGreedData(): Promise<FearGreedData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes = await yf.quote(['^VIX', 'SPY'], {}, { validateResult: false }) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vixQ = quotes.find((q: any) => q?.symbol === '^VIX')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spyQ = quotes.find((q: any) => q?.symbol === 'SPY')

    const vix      = Number(vixQ?.regularMarketPrice)
    const spyPrice = Number(spyQ?.regularMarketPrice)
    const sma200   = Number(spyQ?.twoHundredDayAverage)

    if (!vix || !spyPrice || !sma200) return null

    // VIX 점수: VIX 12→90, VIX 20→60, VIX 30→25, VIX 38→0
    const vixScore = Math.max(0, Math.min(100, 132 - vix * 3.5))

    // SPY 모멘텀 점수: 200일 SMA 대비 이격도 ±10% → 점수 ±30p
    const momentumPct   = (spyPrice / sma200 - 1) * 100
    const momentumScore = Math.max(0, Math.min(100, 50 + momentumPct * 3))

    // 가중 합산 (VIX 55% + 모멘텀 45%)
    const value = Math.round(vixScore * 0.55 + momentumScore * 0.45)

    const classification =
      value >= 75 ? 'Extreme Greed' :
      value >= 55 ? 'Greed'         :
      value >= 45 ? 'Neutral'       :
      value >= 25 ? 'Fear'          :
                    'Extreme Fear'

    return { value, classification, timestamp: Date.now() }
  } catch (err) {
    console.error('[fetchFearGreedData]', err)
    return null
  }
}
