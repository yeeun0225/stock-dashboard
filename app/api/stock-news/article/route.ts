import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ── HTML 유틸 ─────────────────────────────────────────────────
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

// ── 기사 fetch ────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Referer:         'https://finance.naver.com/news/',
      },
      redirect: 'follow',
      cache:    'no-store',
    })
    if (!res.ok) return null
    const finalUrl = res.url
    const buf      = await res.arrayBuffer()
    const html     = (() => {
      try      { return new TextDecoder('euc-kr').decode(buf) }
      catch    { return new TextDecoder('utf-8', { fatal: false }).decode(buf) }
    })()
    return { html, finalUrl }
  } catch {
    return null
  }
}

// ── 기사 파싱 ─────────────────────────────────────────────────
interface ArticleData {
  title:       string
  press:       string
  date:        string
  body:        string
  originalUrl: string
}

function parseArticle(html: string, originalUrl: string): ArticleData {
  // ── 제목 ──────────────────────────────────────────────────
  const rawTitle  = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? ''
  const title     = decodeHtml(
    rawTitle.split('|')[0]?.split('::')[0]?.split(' - ')[0]?.trim() ?? rawTitle,
  )

  // ── 언론사 ────────────────────────────────────────────────
  const pressPatterns = [
    /class="[^"]*media_end_head_top[^"]*"[\s\S]{1,200}?<em[^>]*>([^<]+)<\/em>/,
    /property="og:site_name"\s+content="([^"]+)"/,
    /class="[^"]*press[^"]*"[^>]*>([^<]+)</,
  ]
  let press = ''
  for (const pat of pressPatterns) {
    const m = html.match(pat)
    if (m?.[1]) { press = decodeHtml(m[1]); break }
  }

  // ── 날짜 ──────────────────────────────────────────────────
  const datePatterns = [
    /class="[^"]*_ARTICLE_DATE_TIME[^"]*"[^>]*data-date-time="([^"]+)"/,
    /class="[^"]*media_end_head_info_datestamp[^"]*"[\s\S]{1,300}?(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/,
    /class="[^"]*(?:wdate|date)[^"]*"[^>]*>\s*(\d{4}\.\d{2}\.\d{2}(?:\s+\d{2}:\d{2})?)/,
    /(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/,
  ]
  let date = ''
  for (const pat of datePatterns) {
    const m = html.match(pat)
    if (m?.[1]) { date = m[1].trim(); break }
  }

  // ── 본문 ──────────────────────────────────────────────────
  const bodyPatterns: RegExp[] = [
    // n.news.naver.com
    /id="dic_area"[^>]*>([\s\S]{100,}?)<\/(?:article|div)>/,
    // finance.naver.com 인라인 기사
    /class="[^"]*articleCont[^"]*"[^>]*>([\s\S]{100,}?)<\/div>/,
    // 구형 naver
    /id="articleBodyContents"[^>]*>([\s\S]{100,}?)<\/div>/,
    // 기타 article body
    /class="[^"]*(?:article|news)[_-]body[_-]?(?:cont(?:ent)?)?[^"]*"[^>]*>([\s\S]{100,}?)<\/div>/i,
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

  if (!rawUrl || !rawUrl.includes('naver.com')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // finance.naver.com URL → article_id + office_id 추출
  // → n.news.naver.com/article/{office_id}/{article_id} 직접 시도
  const articleIdM = rawUrl.match(/[?&]article_id=(\d+)/)
  const officeIdM  = rawUrl.match(/[?&]office_id=(\d+)/)
  const nNewsUrl   =
    articleIdM && officeIdM
      ? `https://n.news.naver.com/article/${officeIdM[1]}/${articleIdM[1]}`
      : null

  let result = nNewsUrl ? await fetchHtml(nNewsUrl) : null
  if (!result) result = await fetchHtml(rawUrl)  // 폴백

  if (!result) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  }

  const article = parseArticle(result.html, rawUrl)

  return NextResponse.json(article, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
