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
    let html = ''
    try {
      html = new TextDecoder('utf-8').decode(buf)
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

// ── 본문 추출 ─────────────────────────────────────────────────────
function extractBody(html: string): string {

  // ── 1. 이미지·미디어·스크립트 선제 제거 ──
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi,  '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')   // 사진 + 캡션 통째로
    .replace(/<img[^>]*\/?>/gi,            '')    // 단독 img
    .replace(/<video[\s\S]*?<\/video>/gi,  '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi,'')

  // ── 2. 본문 컨테이너 마커 탐색 (우선순위 순) ──
  const markers = [
    'news_cnt_detail_wrap', 'art_txt',          // mk.co.kr
    'id="dic_area"',                             // naver news
    'itemprop="articleBody"',                    // schema.org
    'article_view', 'articleView',
    'article_body', 'article-body',
    'article_content', 'articleContent',
    'news_content',  'newsContent',
    'view_con', 'news_view', 'view_text',
    'entry-content', 'post-content',
  ]

  let chunk = ''
  for (const marker of markers) {
    const idx = h.indexOf(marker)
    if (idx === -1) continue
    const tagStart = h.lastIndexOf('<', idx)
    if (tagStart === -1) continue
    chunk = h.slice(tagStart, tagStart + 20000)
    break
  }

  // <article> 폴백
  if (!chunk) {
    const m = h.match(/<article[^>]*>([\s\S]{200,})<\/article>/i)
    if (m?.[1]) chunk = m[1]
  }

  // og:description 최후 폴백
  if (!chunk) {
    const m = h.match(/property="og:description"\s+content="([^"]{30,})"/)
    return m?.[1] ? decodeHtml(m[1]) : ''
  }

  // ── 3. 태그 → 텍스트 변환 ──
  let text = decodeHtml(
    chunk
      .replace(/<br\s*\/?>/gi,  '\n')
      .replace(/<\/p>/gi,       '\n')
      .replace(/<\/li>/gi,      '\n')
      .replace(/<\/h[1-6]>/gi,  '\n')
      .replace(/<[^>]+>/g,      ' ')
      .replace(/[ \t]{2,}/g,    ' '),
  ).trim()

  // ── 4. 기사 뒤 부가정보 잘라내기 ──
  // (저작권·기자이메일·관련기사 등 기사 본문 외 내용)
  const cutMarkers = [
    // mk.co.kr 기사 본문 직후 등장하는 위젯·섹션 (최우선)
    '관련종목',
    'Powered by',
    '추천질문',
    'AI가 자동으로 추출',
    '기사 속 관련 종목',
    '핵심요약 쏙',
    'AI 해설 기사',
    'AI 요약',
    '에디터 픽',
    '구독하기',
    // 저작권
    '저작권자', '무단전재', '재배포 금지', '재배포금지',
    'ⓒ ', '© ', 'Copyright',
    // mk.co.kr 구독/인기기사/사이트 섹션
    '정기구독', '이코노미 인기기사', '광고문의', '전체 메뉴',
    '사이트맵', '인터넷신문등록번호', '뉴스레터',
    // 관련기사
    '[관련기사]', '관련 기사', '▶ 관련', '관련뉴스',
    // 기자 정보
    '기자 이메일', '@mk.co.kr', '@maekyung',
    // 일반 구분자
    '■ ', '☞ ', '※ ',
  ]
  for (const cm of cutMarkers) {
    const ci = text.indexOf(cm)
    if (ci > 150) { text = text.slice(0, ci); break }
  }

  // ── 5. 줄 단위 정리 ──
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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

  const body = extractBody(html)

  return { title, press, date, body, originalUrl }
}

// ── GET /api/stock-news/article?url=... ───────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url') ?? ''

  if (!rawUrl || !rawUrl.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const result = await fetchHtml(rawUrl)
  if (!result) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  }

  const article = parseArticle(result.html, result.finalUrl)

  return NextResponse.json(article, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
