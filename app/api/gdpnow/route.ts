import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FRED_KEY = process.env.FRED_API_KEY
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

export interface GDPNowData {
  current:   number | null   // % annualized (SAAR)
  quarter:   string | null   // e.g. "2nd quarter of 2026"
  date:      string | null   // last update date
  source:    'gdpnow' | 'wei' | null  // which source served the data
  timestamp: number
}

// ── FRED WEI fallback ────────────────────────────────────────
// NY Fed Weekly Economic Index (FRED: WEI)
// Scale: annualized 4-quarter GDP growth equivalent — directly comparable to GDPNow
async function fetchWEI(): Promise<GDPNowData | null> {
  try {
    const url = `${FRED_BASE}?series_id=WEI&api_key=${FRED_KEY}&sort_order=desc&limit=2&file_type=json`
    const res  = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obs = ((data.observations ?? []) as any[]).filter(o => o.value !== '.')
    if (!obs.length) return null
    return {
      current:   parseFloat(obs[0].value),
      quarter:   null,
      date:      obs[0].date,
      source:    'wei',
      timestamp: Date.now(),
    }
  } catch {
    return null
  }
}

export async function GET() {
  const empty: GDPNowData = { current: null, quarter: null, date: null, source: null, timestamp: Date.now() }

  try {
    // ── 1) Try Atlanta Fed GDPNow ──────────────────────────
    const res = await fetch(
      'https://www.atlantafed.org/cgi-bin/banking/fredblog/gdpnow-model-version/view/current',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          Referer:           'https://www.atlantafed.org/',
        },
        cache: 'no-store',
      }
    )

    if (res.ok) {
      const html = await res.text()

      // Extract estimate — handles unicode minus (−) and regular minus
      const estMatch = html.match(/is\s+([−\-]?\d+\.?\d*)\s*percent/i)
      const current = estMatch ? parseFloat(estMatch[1].replace('−', '-')) : null

      if (current !== null) {
        const qtrMatch = html.match(/(\d(?:st|nd|rd|th)\s+quarter\s+of\s+\d{4})/i)
        const dtMatch  = html.match(
          /(?:as of|updated(?:\s+through)?)\s+([A-Z][a-z]+\.?\s+\d+,?\s+\d{4})/i
        )
        return NextResponse.json<GDPNowData>(
          {
            current,
            quarter: qtrMatch ? qtrMatch[1] : null,
            date:    dtMatch  ? dtMatch[1].trim() : null,
            source:  'gdpnow',
            timestamp: Date.now(),
          },
          { headers: { 'Cache-Control': 'no-store' } }
        )
      }
    }

    console.warn('[/api/gdpnow] Atlanta Fed unavailable — falling back to FRED WEI')

    // ── 2) Fallback: FRED WEI (NY Fed Weekly Economic Index) ─
    const wei = await fetchWEI()
    if (wei) {
      return NextResponse.json<GDPNowData>(wei, { headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json<GDPNowData>(empty, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[/api/gdpnow]', err)
    // Even if main block throws, try WEI
    const wei = await fetchWEI()
    if (wei) {
      return NextResponse.json<GDPNowData>(wei, { headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json<GDPNowData>(empty, { headers: { 'Cache-Control': 'no-store' } })
  }
}
