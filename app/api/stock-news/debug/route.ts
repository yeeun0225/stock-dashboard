import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// mk.co.kr 카테고리 URL 후보 확인
const CANDIDATES = [
  'https://www.mk.co.kr/news/ranking/it',       // 사용자 확인된 URL
  'https://www.mk.co.kr/news/ranking/economy',
  'https://www.mk.co.kr/news/ranking/finance',
  'https://www.mk.co.kr/news/ranking/business',
  'https://www.mk.co.kr/news/ranking/stock',
  'https://www.mk.co.kr/news/ranking/realestate',
  'https://www.mk.co.kr/news/ranking/science',
]

async function probe(url: string) {
  try {
    const res  = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store', redirect: 'follow' })
    const html = await res.text()
    const links = (html.match(/href="[^"]*\/news\/[^"]+"/g) ?? []).length
    // 제목처럼 보이는 텍스트 패턴 샘플
    const titleSample = html.match(/<h\d[^>]*>([^<]{10,80})<\/h\d>/g)?.slice(0, 3).join(' | ') ?? ''
    return { url, status: res.status, finalUrl: res.url, links, titleSample, sample: html.slice(0, 2000) }
  } catch (e) {
    return { url, error: String(e) }
  }
}

export async function GET() {
  const results = await Promise.allSettled(CANDIDATES.map(probe))
  return NextResponse.json(
    results.map(r => r.status === 'fulfilled' ? r.value : { error: 'rejected' }),
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
