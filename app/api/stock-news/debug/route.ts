import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function probe(url: string) {
  try {
    const res  = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' })
    const html = await res.text()
    const titles = (html.match(/<h3[^>]*class="[^"]*news_ttl[^"]*"[^>]*>/g) ?? []).length
    return { url, status: res.status, titles, sample: html.slice(0, 6000) }
  } catch (e) { return { url, error: String(e) } }
}

export async function GET() {
  const results = await Promise.allSettled([
    // 금융 slug 후보들
    probe('https://www.mk.co.kr/news/ranking/money'),
    probe('https://www.mk.co.kr/news/ranking/bank'),
    probe('https://www.mk.co.kr/news/ranking/invest'),
    // economy 페이지 6000자 — 기사 아이템 전체 구조 확인
    probe('https://www.mk.co.kr/news/ranking/economy'),
  ])
  return NextResponse.json(
    results.map(r => r.status === 'fulfilled' ? r.value : {}),
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
