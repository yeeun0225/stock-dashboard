import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function stripTags(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Referer:         'https://news.google.com/',
      },
      redirect: 'follow',
      cache:    'no-store',
    })
    if (!res.ok) return null
    const finalUrl = res.url
    const buf      = await res.arrayBuffer()
    // UTF-8 우선 (대부분의 뉴스사이트), EUC-KR 폴백
    let html = ''
    try {
      html = new TextDecoder('utf-8').decode(buf)
      // 인코딩 오류가 많으면 EUC-KR 재시도
      if ((html.match(/�/g) ?? []).length > 10) {
        html = new TextDecoder('euc-kr').decode(buf)
      }
    } catch {
      html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    }
    return { html, finalUrl }
  } catch {
    return null
  }
}

interface ArticleData {
  title:       string
  press:       string
  date:        string
  body:        string
  originalUrl: string
}

function parseArticle(html: string, originalUrl: string): ArticleData {
  // 제목
  const rawTitle = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? ''
  const title    = decodeHtml(
    rawTitle.split('|')[0]?.split('::')[0]?.split(' - ')[0]?.split('< ')[0]?.trim() ?? rawTitle,
  )

  // 언론사
  let press = ''
  const pressPatterns = [
    /property="og:site_name"\s+content="([^"]+)"/,
    /name="twitter:site"\s+content="@?([^"]+)"/,
    /class="[^"]*(?:media|publisher|source|press)[^"]*"[^>]*>([^<]{2,30})</i,
  ]
  for (const pat of pressPatterns) {
    const m = html.match(pat)
    if (m?.[1]) { press = decodeHtml(m[1]).trim(); break }
  }

  // 날짜
  let date = ''
  const datePatterns = [
    /property="article:published_time"\s+content="([^"]+)"/,
    /class="[^"]*_ARTICLE_DATE_TIME[^"]*"[^>]*data-date-time="([^"]+)"/,
    /(\d{4}[.\-]\d{2}[.\-]\d{2}\s+\d{2}:\d{2})/,
    /(\d{4}[.\-]\d{2}[.\-]\d{2})/,
  ]
  for (const pat of datePatterns) {
    const m = html.match(pat)
    if (m?.[1]) {
      date = m[1].replace('T', ' ').replace(/\+.*$/, '').trim()
      break
    }
  }

  // 본문 — 여러 사이트 구조 커버
  const bodyPatterns: RegExp[] = [
    // naver news (n.news.naver.com)
    /id="dic_area"[^>]*>([\s\S]{100,}?)<\/(?:article|div)>/,
    // schema.org articleBody
    /itemprop="articleBody"[^>]*>([\s\S]{100,}?)<\/(?:article|div|section)>/i,
    // 한국 뉴스사이트 공통
    /class="[^"]*article[_\-]?(?:view|body|content|text)[^"]*"[^>]*>([\s\S]{100,}?)<\/(?:div|article|section)>/i,
    /id="[^"]*(?:articleBody|article_content|news_content|newsContent)[^"]*"[^>]*>([\s\S]{100,}?)<\/div>/i,
    // generic <article> tag
    /<article[^>]*>([\s\S]{100,}?)<\/article>/i,
    // og:description 폴백
    /property="og:description"\s+content="([^"]{30,})"/,
  ]

  let body = ''
  for (const pat of bodyPatterns) {
    const m = html.match(pat)
    if (m?.[1]) {
      const text = decodeHtml(stripTags(m[1]))
      if (text.length > 80) { body = text; break }
    }
  }

  return { title, press, date, body, originalUrl }
}

// ── GET /api/stock-news/article?url=... ───────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url') ?? ''

  // 기본 URL 검증
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Google News 리다이렉트 URL → 실제 기사 URL로 follow
  const result = await fetchHtml(rawUrl)
  if (!result) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  }

  const article = parseArticle(result.html, result.finalUrl)

  return NextResponse.json(article, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
