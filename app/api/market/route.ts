import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import type { MarketData, QuoteData } from '@/lib/types'

export const dynamic = 'force-dynamic'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

// Yahoo Finance may normalize some symbols on return (e.g. USDKRW=X → KRW=X)
// so we map by array index to guarantee correct slot assignment.
const SYMBOLS = [
  '^KS11', '^KQ11', '^IXIC', '^GSPC', '^DJI',  // indices 0-4
  'USDKRW=X', 'JPYKRW=X', 'CNYKRW=X',           // fx 5-7
  'GC=F', 'SI=F', 'HG=F',                        // commodities 8-10
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

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (await yf.quote(SYMBOLS, {}, { validateResult: false })) as any[]

    const data: MarketData = {
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

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[/api/market]', err)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}
