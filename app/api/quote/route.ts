import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get('tickers')
  if (!param) return NextResponse.json([])

  const tickers = param.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 50)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (await yf.quote(tickers, {}, { validateResult: false })) as any[]
    const quotes = tickers.map((ticker, i) => {
      const q = results[i]
      return {
        ticker,
        name: q?.shortName ?? q?.longName ?? ticker,
        price: q?.regularMarketPrice ?? 0,
        change: q?.regularMarketChange ?? 0,
        changePercent: q?.regularMarketChangePercent ?? 0,
        currency: q?.currency ?? 'USD',
        volume: q?.regularMarketVolume ?? 0,
        open: q?.regularMarketOpen ?? 0,
        high: q?.regularMarketDayHigh ?? 0,
        low: q?.regularMarketDayLow ?? 0,
        prevClose: q?.regularMarketPreviousClose ?? 0,
        avgVolume: q?.averageDailyVolume3Month ?? 0,
        marketCap: q?.marketCap ?? null,
        pe: q?.trailingPE ?? null,
        week52High: q?.fiftyTwoWeekHigh ?? null,
        week52Low: q?.fiftyTwoWeekLow ?? null,
      }
    })
    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[quote]', err)
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
