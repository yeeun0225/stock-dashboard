import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── 네이버 리서치 리포트 모바일 뷰어 ────────────────────────────
// finance.naver.com은 모바일 UA를 감지해 리다이렉트함.
// 이 페이지는 서버에서 데스크탑 UA로 리포트를 fetch해 모바일에 제공.

interface PageProps {
  params: Promise<{ nid: string }>
}

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
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function fetchArticleHtml(nid: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://finance.naver.com/research/company_read.naver?nid=${nid}&page=1`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          Referer:         'https://finance.naver.com/research/',
        },
        cache: 'no-store',
      },
    )
    if (!res.ok) return null

    const buf = await res.arrayBuffer()
    try { return new TextDecoder('euc-kr').decode(buf) }
    catch { return new TextDecoder('utf-8', { fatal: false }).decode(buf) }
  } catch {
    return null
  }
}

interface ArticleMeta {
  title:    string
  firm:     string
  date:     string
  pdfUrl:   string | null
  body:     string
}

function parseArticle(html: string): ArticleMeta {
  // 제목: <title>리포트명 : 네이버 금융</title>
  const titleRaw = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? ''
  const title    = decodeHtml(titleRaw.split(':')[0]?.trim() ?? titleRaw)

  // PDF URL (list에 없었어도 article page에 있을 수 있음)
  const pdfUrl = html.match(/href="(https:\/\/stock\.pstatic\.net\/[^"]+\.pdf)"/)?.[1] ?? null

  // 증권사
  const firmM = html.match(/class="[^"]*num_company[^"]*"[^>]*>([^<]+)</)
  const firm  = firmM ? decodeHtml(firmM[1]) : ''

  // 날짜
  const dateM = html.match(/class="[^"]*date[^"]*"[^>]*>\s*(\d{4}\.\d{2}\.\d{2})\s*</)
  const date  = dateM?.[1] ?? ''

  // ── 본문 추출 ──────────────────────────────────────────────
  // 네이버 리서치 페이지는 다양한 레이아웃이 있어 여러 패턴 시도
  const bodyPatterns: RegExp[] = [
    // 1) view_cnt / view_content 클래스를 가진 td 또는 div
    /class="[^"]*view_c(?:nt|ontent)[^"]*"[^>]*>([\s\S]{80,}?)<\/(?:td|div)>/i,
    // 2) report_txt 클래스
    /class="[^"]*report_txt[^"]*"[^>]*>([\s\S]{80,}?)<\/(?:td|div)>/i,
    // 3) 큰 colspan td (본문이 단일 셀인 경우)
    /colspan="[5-9]"[^>]*>([\s\S]{200,4000}?)<\/td>/,
    // 4) txt_body 또는 read_body 클래스
    /class="[^"]*(?:txt|read)_body[^"]*"[^>]*>([\s\S]{80,}?)<\/(?:td|div)>/i,
  ]

  let body = ''
  for (const pat of bodyPatterns) {
    const m = html.match(pat)
    if (m?.[1]) {
      const text = decodeHtml(stripTags(m[1]))
      if (text.length > 80) { body = text; break }
    }
  }

  return { title, firm, date, pdfUrl, body }
}

// ── 페이지 컴포넌트 ──────────────────────────────────────────
export default async function ResearchViewPage({ params }: PageProps) {
  const { nid } = await params
  if (!nid || !/^\d+$/.test(nid)) notFound()

  const html = await fetchArticleHtml(nid)
  if (!html) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 px-4 pt-8 pb-12 max-w-2xl mx-auto">
        <Link href="/news" className="text-sm text-gray-400 hover:text-white">← 리서치</Link>
        <p className="mt-8 text-gray-500 text-sm">리포트를 불러오지 못했어요.</p>
        <a
          href={`https://finance.naver.com/research/company_read.naver?nid=${nid}&page=1`}
          className="mt-3 inline-block text-blue-400 text-sm underline"
          target="_blank" rel="noopener noreferrer"
        >
          네이버에서 직접 열기 →
        </a>
      </div>
    )
  }

  const { title, firm, date, pdfUrl, body } = parseArticle(html)
  const desktopUrl = `https://finance.naver.com/research/company_read.naver?nid=${nid}&page=1`

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/news" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← 리서치
          </Link>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded-lg px-2.5 py-1 hover:bg-orange-500/25 transition-colors"
              >
                📄 PDF
              </a>
            )}
            <a
              href={desktopUrl}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2.5 py-1 transition-colors"
            >
              PC 원문
            </a>
          </div>
        </div>

        {/* 제목 */}
        {title && (
          <h1 className="text-base font-bold text-white leading-snug mb-3">{title}</h1>
        )}

        {/* 메타 */}
        {(firm || date) && (
          <p className="text-xs text-gray-500 mb-5">
            {firm}{firm && date ? ' · ' : ''}{date}
          </p>
        )}

        {/* 본문 */}
        {body ? (
          <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-900 rounded-2xl p-5 border border-gray-800">
            {body}
          </div>
        ) : (
          // 본문 추출 실패 → 안내 + PC 원문 링크
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-2">리포트 본문을 표시하지 못했어요.</p>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              이 리포트는 PC 전용 레이아웃으로 제공됩니다.
              Safari에서는 <span className="text-gray-500">AA 메뉴 → 데스크탑 웹사이트 요청</span>으로
              PC 버전을 볼 수 있어요.
            </p>
            <a
              href={desktopUrl}
              target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              네이버에서 원문 보기 →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
