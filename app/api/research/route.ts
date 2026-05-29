import { NextResponse } from 'next/server'

// 24시간 캐시 — 매일 오전 cron이 revalidatePath로 갱신
export const revalidate = 86400

export interface ResearchItem {
  stockCode: string
  stockName: string
  title:     string
  nid:       string
  firm:      string
  date:      string
  isNew:     boolean
  readUrl:   string
  pdfUrl:    string | null
}

export interface ResearchData {
  items:          ResearchItem[]
  page:           number
  totalPages:     number | null
  reachedCutoff:  boolean          // 이 페이지에 afterDate 이전 기사가 포함됨 → 다음 페이지 없음
  timestamp:      number
}

// "26.05.29" → "2026-05-29" (ISO 비교용)
function naverDateToISO(d: string): string | null {
  if (!d) return null
  const parts = d.trim().split('.')
  if (parts.length !== 3 || parts[0].length !== 2) return null
  return `20${parts[0]}-${parts[1]}-${parts[2]}`
}

// 기본 HTML 엔티티 디코딩
function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim()
}

export async function GET(request: Request) {
  const params    = new URL(request.url).searchParams
  const page      = Math.max(1, parseInt(params.get('page') ?? '1', 10))
  const afterDate = params.get('afterDate') ?? '2026-01-01'   // ISO 기준일 (이 날짜 이후만 포함)

  try {
    const url = `https://finance.naver.com/research/company_list.naver?page=${page}`

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5',
        Referer: 'https://finance.naver.com/research/',
      },
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Naver returned ${res.status}` }, { status: 502 })
    }

    // 네이버 금융은 EUC-KR 인코딩 (charset=utf-8 선언과 무관)
    const buffer = await res.arrayBuffer()
    let html: string
    try {
      html = new TextDecoder('euc-kr').decode(buffer)
    } catch {
      html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
    }

    // ── 각 종목 데이터 행 파싱 ──────────────────────────────────────
    // 구조: <tr> <td 종목링크> <td 리포트링크> <td 증권사> <td pdf?> <td 날짜> <td 조회수> </tr>
    const items: ResearchItem[] = []

    const rowRegex =
      /<tr>\s*<td style="padding-left:10">\s*<a href="\/item\/main\.naver\?code=(\d+)"[^>]*title="([^"]+)"[^>]*>[^<]*<\/a>[^<]*<\/td>([\s\S]*?)<\/tr>/g

    let rowMatch
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const stockCode = rowMatch[1]
      const stockName = decodeHtml(rowMatch[2])
      const inner     = rowMatch[3]

      // 리포트 제목 + nid
      const titleMatch = inner.match(
        /<a href="company_read\.naver\?nid=(\d+)[^"]*">([^<]+)<\/a>/
      )
      if (!titleMatch) continue
      const nid   = titleMatch[1]
      const title = decodeHtml(titleMatch[2])

      // NEW 배지
      const isNew = /ico_research_new\.gif/.test(inner)

      // 증권사 (제목 td 닫힌 뒤 첫 번째 plain td)
      // </td> 이후 <td>text</td> 패턴
      const firmMatch = inner.match(/<\/td>\s*<td>([^<]+)<\/td>/)
      const firm = firmMatch ? decodeHtml(firmMatch[1]) : ''

      // PDF URL
      const pdfMatch = inner.match(/href="(https:\/\/stock\.pstatic\.net\/[^"]+\.pdf)"/)
      const pdfUrl = pdfMatch?.[1] ?? null

      // 날짜
      const dateMatch = inner.match(
        /<td class="date" style="padding-left:5px">([^<]+)<\/td>/
      )
      const date = dateMatch?.[1]?.trim() ?? ''

      items.push({
        stockCode,
        stockName,
        title,
        nid,
        firm,
        date,
        isNew,
        readUrl: `https://finance.naver.com/research/company_read.naver?nid=${nid}&page=1`,
        pdfUrl,
      })
    }

    // ── afterDate 필터: afterDate 이전 기사 제거 + reachedCutoff 계산 ──
    let reachedCutoff = false
    const filtered: ResearchItem[] = []
    for (const item of items) {
      const iso = naverDateToISO(item.date)
      if (iso && iso < afterDate) {
        reachedCutoff = true   // 기준일 이전 기사 발견 → 이 페이지에서 컷오프
        // 이 기사는 포함하지 않음
      } else {
        filtered.push(item)
      }
    }

    // ── 전체 페이지 수 추출 (페이저에서 최대 page= 숫자) ─────────────
    const pageNums = [...html.matchAll(/company_list\.naver\?page=(\d+)/g)]
      .map(m => parseInt(m[1], 10))
      .filter(n => !isNaN(n) && n > 0)
    const totalPages = pageNums.length ? Math.max(...pageNums) : null

    return NextResponse.json<ResearchData>(
      { items: filtered, page, totalPages, reachedCutoff, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[/api/research]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
