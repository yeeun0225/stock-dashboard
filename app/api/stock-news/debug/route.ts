import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// og:url 에서 발견한 실제 내부 라우팅 URL + __NEXT_DATA__ 확인
const TARGETS = [
  // finance.naver.com 내부 URL (og:url 에서 발견)
  'https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258&type=0',
  // news.naver.com section 직접
  'https://news.naver.com/main/list.naver?mode=LSS2D&section_id=101&section_id2=258',
  // Naver 뉴스 RSS 피드
  'https://finance.naver.com/rss/news.naver?category=시황속보',
  'https://news.naver.com/rss/news/main.rss',
  // 네이버 금융 뉴스 API 후보
  'https://m.stock.naver.com/api/news/economy?pageSize=5&page=1',
  'https://m.stock.naver.com/api/news?category=economy&pageSize=5',
]

async function probe(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9', Referer: 'https://finance.naver.com/' },
      cache: 'no-store', redirect: 'follow',
    })
    const buf  = await res.arrayBuffer()
    const html = (() => { try { return new TextDecoder('euc-kr').decode(buf) } catch { return new TextDecoder('utf-8', { fatal: false }).decode(buf) } })()

    const newsLinks    = (html.match(/newsRead/g) ?? []).length
    const hasNextData  = html.includes('__NEXT_DATA__')
    const isJson       = html.trimStart().startsWith('{') || html.trimStart().startsWith('[')
    const isRss        = html.includes('<rss') || html.includes('<item>')

    // __NEXT_DATA__ JSON 추출 (최대 3000자)
    let nextDataSnippet = ''
    if (hasNextData) {
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
      if (m?.[1]) nextDataSnippet = m[1].slice(0, 3000)
    }

    // RSS 아이템 추출
    let rssItems = ''
    if (isRss) {
      const items = html.match(/<item>([\s\S]*?)<\/item>/g) ?? []
      rssItems = items.slice(0, 3).join('\n')
    }

    return {
      url, status: res.status, finalUrl: res.url,
      newsLinks, hasNextData, isJson, isRss,
      nextDataSnippet: nextDataSnippet || undefined,
      rssItems: rssItems || undefined,
      sample: (!hasNextData && !isRss) ? html.slice(0, 600) : undefined,
    }
  } catch (e) {
    return { url, error: String(e) }
  }
}

export async function GET() {
  const results = await Promise.allSettled(TARGETS.map(probe))
  return NextResponse.json(
    results.map(r => r.status === 'fulfilled' ? r.value : { error: 'rejected' }),
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
