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

export async function fetchFearGreedData(): Promise<FearGreedData | null> {
  try {
    const res = await fetch(
      'https://production.dataviz.cnn.io/index/fearandgreed/graphdata/',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://edition.cnn.com/',
          Accept:  'application/json',
        },
      }
    )
    const json = await res.json()
    const fg = json?.fear_and_greed
    return {
      value:          Math.round(Number(fg?.score ?? 50)),
      classification: fg?.rating ?? 'Neutral',
      timestamp:      Date.now(),
    }
  } catch (err) {
    console.error('[fetchFearGreedData]', err)
    return { value: 50, classification: 'Neutral', timestamp: Date.now() }
  }
}
