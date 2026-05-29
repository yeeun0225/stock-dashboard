import { NextResponse } from 'next/server'

export const revalidate = 300   // 5분 캐시

// ── 타입 ─────────────────────────────────────────────────────
export interface NewsItem {
  title:   string
  url:     string
  press:   string
  time:    string
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

// ── 카테고리 목록 ─────────────────────────────────────────────
const CATEGORIES = [
  { key: '시황속보',  label: '시황·전망'    },
  { key: '투자정보',  label: '기업·종목분석' },
  { key: '해외증시',  label: '해외증시'     },
  { key: '채권선물',  label: '채권·선물'    },
  { key: '공시정보',  label: '공시·메모'    },
  { key: '외환',      label: '환율'        },
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

// ── 뉴스 파싱 ─────────────────────────────────────────────────
// finance.naver.com/news/newslist.naver 페이지에서
// newsRead.naver href를 가진 모든 <a>를 수집 → 주변 컨텍스트로 press/time 추출
function parseNewsItems(html: string): NewsItem[] {
  const items: NewsItem[] = []
  const seen  = new Set<string>()

  // finance.naver.com 뉴스 링크 패턴 (절대 경로 or 상대 경로 모두)
  const linkRe =
    /href="((?:https?:\/\/finance\.naver\.com)?\/news\/newsRead\.naver\?[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null

  while ((m = linkRe.exec(html)) !== null && items.length < 6) {
    const rawHref = m[1]
    const url     = rawHref.startsWith('http')
      ? rawHref
      : `https://finance.naver.com${rawHref}`

    if (seen.has(url)) continue
    seen.add(url)

    // 제목 (중첩 태그 제거)
    const title = decodeHtml(m[2]).trim()
    if (title.length < 5) continue

    // 링크 직후 400자 컨텍스트에서 press / time 추출
    const ctxStart = m.index + m[0].length
    const ctx      = html.slice(ctxStart, ctxStart + 400)

    const pressM = ctx.match(/class="[^"]*press[^"]*"[^>]*>([\s\S]*?)<\//)
    const press  = pressM ? decodeHtml(pressM[1]) : ''

    const timeM  = ctx.match(/class="[^"]*(?:wdate|date)[^"]*"[^>]*>([\s\S]*?)<\//)
    const time   = timeM  ? decodeHtml(timeM[1])  : ''

    items.push({ title, url, press, time })
  }

  return items
}

// ── 카테고리 fetch ────────────────────────────────────────────
async function fetchCategory(key: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://finance.naver.com/news/newslist.naver?category=${encodeURIComponent(key)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          Referer:         'https://finance.naver.com/news/',
        },
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return []

    const buf  = await res.arrayBuffer()
    const html = (() => {
      try      { return new TextDecoder('euc-kr').decode(buf) }
      catch    { return new TextDecoder('utf-8', { fatal: false }).decode(buf) }
    })()

    return parseNewsItems(html)
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
      items: await fetchCategory(cat.key),
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
