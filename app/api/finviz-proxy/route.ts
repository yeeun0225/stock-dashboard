import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://finviz.com/map.ashx?t=sec&st=d1', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        Referer: 'https://finviz.com/',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Finviz unavailable' }, { status: 502 })
    }

    const buf = await res.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/gif',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (err) {
    console.error('[/api/finviz-proxy]', err)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 })
  }
}
