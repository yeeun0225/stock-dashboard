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
function parseNewsItems(html: string): NewsItem[] {
  const items: NewsItem[] = []

  // ── 패턴 1: <li class="blockX"> 구조 ───────────────────────
  const liRe = /<li[^>]*class="[^"]*block\d+[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
  let m: RegExpExecArray | null
  while ((m = liRe.exec(html)) !== null && items.length < 6) {
    const block = m[1]

    // 제목 & URL: newsRead.naver 링크
    const linkM = block.match(
      /href="(\/news\/newsRead\.naver\?[^"]+)"[^>]*>\s*([\s\S]{5,200}?)\s*<\/a>/,
    )
    if (!linkM) continue

    const url   = `https://finance.naver.com${linkM[1]}`
    const title = decodeHtml(linkM[2])
    if (title.length < 5) continue

    // 언론사
    const pressM = block.match(/class="[^"]*press[^"]*"[^>]*>([\s\S]*?)<\//)
    const press  = pressM ? decodeHtml(pressM[1]) : ''

    // 시간
    const timeM = block.match(/class="[^"]*(?:wdate|date)[^"]*"[^>]*>([\s\S]*?)<\//)
    const time  = timeM ? decodeHtml(timeM[1]) : ''

    items.push({ title, url, press, time })
  }

  // ── 패턴 2: <dl> 구조 (폴백) ───────────────────────────────
  if (items.length === 0) {
    const dlRe = /<dl[^>]*>([\s\S]*?)<\/dl>/gi
    while ((m = dlRe.exec(html)) !== null && items.length < 6) {
      const block = m[1]

      const linkM = block.match(
        /href="([^"]*newsRead[^"]*)"[^>]*>([\s\S]{5,200}?)<\/a>/,
      )
      if (!linkM) continue

      const rawUrl = linkM[1]
      const url    = rawUrl.startsWith('http')
        ? rawUrl
        : `https://finance.naver.com${rawUrl}`
      const title = decodeHtml(linkM[2])
      if (title.length < 5) continue

      const pressM = block.match(/class="[^"]*press[^"]*"[^>]*>([\s\S]*?)<\//)
      const press  = pressM ? decodeHtml(pressM[1]) : ''

      const timeM = block.match(/(\d{4}\.\d{2}\.\d{2})/)
      const time  = timeM?.[1] ?? ''

      items.push({ title, url, press, time })
    }
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
