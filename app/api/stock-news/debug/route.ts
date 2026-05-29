import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  Referer:         'https://finance.naver.com/',
}

// 여러 URL 후보를 테스트
const CANDIDATES = [
  'https://finance.naver.com/news/mainnews.naver',
  'https://finance.naver.com/news/news_list.naver?category=마켓뉴스',
  'https://finance.naver.com/news/',
  'https://m.stock.naver.com/api/news/economy/list?pageSize=5&page=1',
  'https://m.stock.naver.com/api/news/market/list?pageSize=5&page=1',
  'https://m.stock.naver.com/api/news/flashnews?pageSize=5&page=1',
  'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=101',
]

async function probe(url: string) {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store', redirect: 'follow' })
    const buf  = await res.arrayBuffer()
    const html = (() => { try { return new TextDecoder('euc-kr').decode(buf) } catch { return new TextDecoder('utf-8', { fatal: false }).decode(buf) } })()
    const newsLinks = (html.match(/newsRead/g) ?? []).length
    const isJson = html.trimStart().startsWith('{') || html.trimStart().startsWith('[')
    return {
      url,
      status:    res.status,
      finalUrl:  res.url,
      newsLinks,
      isJson,
      sample:    html.slice(0, 800),
    }
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
