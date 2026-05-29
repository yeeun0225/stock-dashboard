import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export interface InvestorData {
  date: string
  individual: { buy: number; sell: number; net: number }
  institution: { buy: number; sell: number; net: number }
  foreign: { buy: number; sell: number; net: number }
  pension: { buy: number; sell: number; net: number }
}

// Extract 6-digit KR code from ticker like "005930.KS" or "000660.KQ"
function extractKrCode(ticker: string): string | null {
  const match = ticker.match(/^(\d{6})\.(KS|KQ)$/i)
  return match ? match[1] : null
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') ?? ''
  const code = extractKrCode(ticker)
  if (!code) return NextResponse.json(null)

  try {
    const res = await fetch(
      `https://m.stock.naver.com/api/stock/${code}/investor`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://m.stock.naver.com/',
          Accept: 'application/json',
        },
      }
    )

    if (!res.ok) return NextResponse.json(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any

    // Naver Finance returns array of daily investor data; take most recent entry
    const list: any[] = Array.isArray(json)
      ? json
      : json?.stockInvestorList ?? json?.data ?? []

    if (!list.length) return NextResponse.json(null)

    const latest = list[0]

    // Field names vary by API version — try both conventions
    const n = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)

    const data: InvestorData = {
      date: String(latest.bizDate ?? latest.stckBsopDate ?? ''),
      individual: {
        buy: n(latest.individualBuyAmt ?? latest.prsn?.buyAmt ?? latest.indvBuyAmt),
        sell: n(latest.individualSellAmt ?? latest.prsn?.sellAmt ?? latest.indvSellAmt),
        net: n(latest.individualNetAmt ?? latest.prsn?.netBuyAmt ?? latest.indvNetAmt),
      },
      institution: {
        buy: n(latest.institutionBuyAmt ?? latest.orgn?.buyAmt ?? latest.orgnBuyAmt),
        sell: n(latest.institutionSellAmt ?? latest.orgn?.sellAmt ?? latest.orgnSellAmt),
        net: n(latest.institutionNetAmt ?? latest.orgn?.netBuyAmt ?? latest.orgnNetAmt),
      },
      foreign: {
        buy: n(latest.foreignBuyAmt ?? latest.frgn?.buyAmt ?? latest.frgnBuyAmt),
        sell: n(latest.foreignSellAmt ?? latest.frgn?.sellAmt ?? latest.frgnSellAmt),
        net: n(latest.foreignNetAmt ?? latest.frgn?.netBuyAmt ?? latest.frgnNetAmt),
      },
      pension: {
        buy: n(latest.pensionBuyAmt ?? latest.pnsnFnd?.buyAmt ?? latest.pnsnBuyAmt),
        sell: n(latest.pensionSellAmt ?? latest.pnsnFnd?.sellAmt ?? latest.pnsnSellAmt),
        net: n(latest.pensionNetAmt ?? latest.pnsnFnd?.netBuyAmt ?? latest.pnsnNetAmt),
      },
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[kr-investor]', err)
    return NextResponse.json(null)
  }
}
