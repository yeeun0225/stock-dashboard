import { NextResponse } from 'next/server'

export const revalidate = 300   // 5분 캐시

// ── 타입 ─────────────────────────────────────────────────────
export interface NewsItem {
  title:  string
  url:    string
  press:  string
  time:   string
}

export interface NewsCategory {
  key:   string
  label: string
  items: NewsItem[]
}

export interface StockNewsData {
  categories: NewsCategory[]
  timestamp:  number
}

// ── Google News RSS 카테고리 & 검색어 ────────────────────────
const CATEGORY_FEEDS = [
  { key: 'market',     label: '시황·전망',     query: '코스피 코스닥 증시 시황' },
  { key: 'stock',      label: '기업·종목분석',  query: '종목분석 주식 매수 목표주가' },
  { key: 'overseas',   label: '해외증시',      query: '나스닥 뉴욕증시 다우 S&P500' },
  { key: 'bond',       label: '채권·선물',     query: '채권 국채 선물 기준금리' },
  { key: 'disclosure', label: '공시·메모',     query: '공시 자사주 유상증자 전환사채' },
  { key: 'fx',         label: '환율',         query: '환율 원달러 달러 외환' },
]

// ── HTML 엔티티 & 태그 제거 ───────────────────────────────────
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// ── pubDate → "N분 전" 형식 ──────────────────────────────────
function parsePubDate(s: string): string {
  if (!s) return ''
  try {
    const d    = new Date(s)
    if (isNaN(d.getTime())) return ''
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60)  return `${mins}분 전`
    const hrs = Math.floor(mins / 60)
    if (hrs  < 24)  return `${hrs}시간 전`
    const days = Math.floor(hrs / 24)
    return `${days}일 전`
  } catch {
    return ''
  }
}

// ── RSS XML 파싱 ─────────────────────────────────────────────
function parseRss(xml: string): NewsItem[] {
  const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

  return blocks.slice(0, 6).flatMap(item => {
    // 제목 (CDATA or plain)
    const titleM =
      item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ??
      item.match(/<title>([^<]+)<\/title>/)
    const title = decodeHtml(titleM?.[1] ?? '').trim()
    if (title.length < 5) return []

    // URL: <link> 또는 <guid>
    const linkM =
      item.match(/<link>([^<\s]+)<\/link>/) ??
      item.match(/<guid[^>]*>([^<]+)<\/guid>/)
    const url = (linkM?.[1] ?? '').trim()
    if (!url.startsWith('http')) return []

    // 언론사: <source>
    const pressM = item.match(/<source[^>]*>([^<]+)<\/source>/)
    const press  = decodeHtml(pressM?.[1] ?? '').trim()

    // 날짜
    const dateM = item.match(/<pubDate>([^<]+)<\/pubDate>/)
    const time  = parsePubDate(dateM?.[1] ?? '')

    return [{ title, url, press, time }]
  })
}

// ── RSS fetch ─────────────────────────────────────────────────
async function fetchFeed(query: string): Promise<NewsItem[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRss(xml)
  } catch {
    return []
  }
}

// ── GET ───────────────────────────────────────────────────────
export async function GET() {
  const results = await Promise.allSettled(
    CATEGORY_FEEDS.map(async cat => ({
      key:   cat.key,
      label: cat.label,
      items: await fetchFeed(cat.query),
    })),
  )

  const categories: NewsCategory[] = results
    .filter((r): r is PromiseFulfilledResult<NewsCategory> => r.status === 'fulfilled')
    .map(r => r.value)

  return NextResponse.json<StockNewsData>(
    { categories, timestamp: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
