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

// ── 카테고리 ─────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'economy',    label: '경제',     slug: 'economy'    },
  { key: 'money',      label: '금융',     slug: 'money'      },
  { key: 'business',   label: '기업',     slug: 'business'   },
  { key: 'stock',      label: '증권',     slug: 'stock'      },
  { key: 'realestate', label: '부동산',   slug: 'realestate' },
  { key: 'it',         label: '테크·과학', slug: 'it'         },
]

// ── HTML 유틸 ─────────────────────────────────────────────────
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

// ── mk.co.kr 랭킹 페이지 파싱 ────────────────────────────────
// <h3 class="news_ttl"> 직전 600자에서 mk.co.kr 뉴스 href 추출
function parseMkPage(html: string): NewsItem[] {
  const items: NewsItem[] = []
  const seen  = new Set<string>()

  const h3Re = /<h3[^>]*class="[^"]*news_ttl[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi
  let m: RegExpExecArray | null

  while ((m = h3Re.exec(html)) !== null && items.length < 10) {
    const title = decodeHtml(m[1]).trim()
    if (title.length < 5) continue

    // 이 h3 앞 600자 슬라이스에서 가장 마지막 mk 뉴스 href 찾기
    const slice  = html.slice(Math.max(0, m.index - 600), m.index)
    const hrefs  = [...slice.matchAll(
      /href="((?:https?:\/\/www\.mk\.co\.kr)?\/news\/[^"#?]+)"/g,
    )]
    if (!hrefs.length) continue

    const rawUrl = hrefs[hrefs.length - 1][1]
    const url    = rawUrl.startsWith('http') ? rawUrl : `https://www.mk.co.kr${rawUrl}`
    if (seen.has(url)) continue
    seen.add(url)

    items.push({ title, url, press: '매일경제', time: '' })
  }

  return items
}

// ── 카테고리 fetch ────────────────────────────────────────────
async function fetchCategory(slug: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://www.mk.co.kr/news/ranking/${slug}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          Referer:         'https://www.mk.co.kr/',
        },
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return []
    const html = await res.text()
    return parseMkPage(html)
  } catch {
    return []
  }
}

// ── GET ───────────────────────────────────────────────────────
export async function GET() {
  const results = await Promise.allSettled(
    CATEGORIES.map(async cat => ({
      key:   cat.key,
      label: cat.label,
      items: await fetchCategory(cat.slug),
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
