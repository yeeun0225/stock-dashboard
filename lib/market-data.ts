import YahooFinance from 'yahoo-finance2'
import type { MarketData, FearGreedData, QuoteData } from './types'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const SYMBOLS = [
  '^KS11', '^KQ11', '^IXIC', '^GSPC', '^DJI',
  'USDKRW=X', 'JPYKRW=X', 'CNYKRW=X',
  'GC=F', 'SI=F', 'HG=F',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuote(q: any, fallbackSymbol: string): QuoteData {
  return {
    symbol: q?.symbol ?? fallbackSymbol,
    price: q?.regularMarketPrice ?? 0,
    change: q?.regularMarketChange ?? 0,
    changePercent: q?.regularMarketChangePercent ?? 0,
    prevClose: q?.regularMarketPreviousClose ?? 0,
  }
}

export async function fetchMarketData(): Promise<MarketData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (await yf.quote(SYMBOLS, {}, { validateResult: false })) as any[]
    return {
      indices: {
        kospi: toQuote(r[0], '^KS11'),
        kosdaq: toQuote(r[1], '^KQ11'),
        nasdaq: toQuote(r[2], '^IXIC'),
        sp500: toQuote(r[3], '^GSPC'),
        dow: toQuote(r[4], '^DJI'),
      },
      fx: {
        usdkrw: toQuote(r[5], 'USDKRW=X'),
        jpykrw: toQuote(r[6], 'JPYKRW=X'),
        cnykrw: toQuote(r[7], 'CNYKRW=X'),
      },
      commodities: {
        gold: toQuote(r[8], 'GC=F'),
        silver: toQuote(r[9], 'SI=F'),
        copper: toQuote(r[10], 'HG=F'),
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
    const res = await fetch('https://api.alternative.me/fng/')
    const json = await res.json()
    const item = json?.data?.[0]
    return {
      value: Number(item?.value ?? 50),
      classification: item?.value_classification ?? 'Neutral',
      timestamp: Date.now(),
    }
  } catch (err) {
    console.error('[fetchFearGreedData]', err)
    return { value: 50, classification: 'Neutral', timestamp: Date.now() }
  }
}
