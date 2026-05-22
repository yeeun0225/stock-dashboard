import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://api.alternative.me/fng/', {
      next: { revalidate: 0 },
    })
    const json = await res.json()
    const item = json?.data?.[0]

    return NextResponse.json(
      {
        value: Number(item?.value ?? 50),
        classification: item?.value_classification ?? 'Neutral',
        timestamp: Date.now(),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error('[/api/fear-greed]', err)
    return NextResponse.json(
      { value: 50, classification: 'Neutral', timestamp: Date.now() },
      { status: 200 }
    )
  }
}
