import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export async function GET() {
  try {
    const res = await fetch('https://www.38.co.kr/html/fund/?lt=1', {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Referer: 'https://www.38.co.kr/',
      },
      cache: 'no-store',
    })
    const buf    = await res.arrayBuffer()
    const utf8   = new TextDecoder('utf-8').decode(buf)
    const eucKr  = new TextDecoder('euc-kr', { fatal: false }).decode(buf)
    const garbled = (utf8.match(/�/g) ?? []).length

    const html   = garbled > 5 ? eucKr : utf8

    return NextResponse.json({
      status: res.status,
      garbled,
      encoding: garbled > 5 ? 'euc-kr' : 'utf-8',
      sampleHtml: html.slice(0, 8000),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
