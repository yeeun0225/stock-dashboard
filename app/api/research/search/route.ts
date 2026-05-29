import { NextResponse } from 'next/server'
import type { ResearchItem } from '@/app/api/research/route'

export const dynamic = 'force-dynamic'

// ── Naver Finance scraping helpers (mirrors research/route.ts) ──
function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim()
}

function naverDateToISO(d: string): string | null {
  if (!d) return null
  const parts = d.trim().split('.')
  if (parts.length !== 3 || parts[0].length !== 2) return null
  return `20${parts[0]}-${parts[1]}-${parts[2]}`
}

const NAVER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5',
  Referer:         'https://finance.naver.com/research/',
}

interface PageResult {
  items:         ResearchItem[]
  reachedCutoff: boolean          // 이 페이지에 afterDate 이전 기사가 있음
}

async function scrapePage(page: number, afterDate: string): Promise<PageResult> {
  try {
    const res = await fetch(
      `https://finance.naver.com/research/company_list.naver?page=${page}`,
      { headers: NAVER_HEADERS, cache: 'no-store' },
    )
    if (!res.ok) return { items: [], reachedCutoff: false }

    const buf = await res.arrayBuffer()
    let html: string
    try { html = new TextDecoder('euc-kr').decode(buf) }
    catch { html = new TextDecoder('utf-8', { fatal: false }).decode(buf) }

    const rowRe =
      /<tr>\s*<td style="padding-left:10">\s*<a href="\/item\/main\.naver\?code=(\d+)"[^>]*title="([^"]+)"[^>]*>[^<]*<\/a>[^<]*<\/td>([\s\S]*?)<\/tr>/g

    const items: ResearchItem[] = []
    let reachedCutoff = false
    let m: RegExpExecArray | null

    while ((m = rowRe.exec(html)) !== null) {
      const stockCode = m[1]
      const stockName = decodeHtml(m[2])
      const inner     = m[3]

      const titleM = inner.match(/<a href="company_read\.naver\?nid=(\d+)[^"]*">([^<]+)<\/a>/)
      if (!titleM) continue

      const nid   = titleM[1]
      const title = decodeHtml(titleM[2])
      const isNew = /ico_research_new\.gif/.test(inner)

      const firmM = inner.match(/<\/td>\s*<td>([^<]+)<\/td>/)
      const firm  = firmM ? decodeHtml(firmM[1]) : ''

      const pdfM  = inner.match(/href="(https:\/\/stock\.pstatic\.net\/[^"]+\.pdf)"/)
      const pdfUrl = pdfM?.[1] ?? null

      const dateM = inner.match(/<td class="date" style="padding-left:5px">([^<]+)<\/td>/)
      const date  = dateM?.[1]?.trim() ?? ''

      const iso = naverDateToISO(date)
      if (iso && iso < afterDate) {
        reachedCutoff = true
        continue  // 기준일 이전 기사는 결과에 포함하지 않음
      }

      items.push({
        stockCode, stockName, title, nid, firm, date, isNew,
        readUrl: `https://finance.naver.com/research/company_read.naver?nid=${nid}&page=1`,
        pdfUrl,
      })
    }

    return { items, reachedCutoff }
  } catch {
    return { items: [], reachedCutoff: false }
  }
}

// ── GET /api/research/search?q=삼성&afterDate=2026-01-01 ────────
export async function GET(request: Request) {
  const params    = new URL(request.url).searchParams
  const q         = (params.get('q') ?? '').toLowerCase().trim()
  const afterDate = params.get('afterDate') ?? '2026-01-01'

  if (q.length < 2) {
    return NextResponse.json(
      { items: [], total: 0 },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // 기준일 이후 모든 페이지를 배치(20개씩) 병렬로 스캔
  const MAX_PAGES  = 200
  const BATCH_SIZE = 20
  const matches: ResearchItem[] = []
  let done = false

  for (let start = 1; start <= MAX_PAGES && !done; start += BATCH_SIZE) {
    const pageNums = Array.from(
      { length: BATCH_SIZE },
      (_, i) => start + i,
    ).filter(p => p <= MAX_PAGES)

    const results = await Promise.allSettled(
      pageNums.map(p => scrapePage(p, afterDate)),
    )

    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      const { items, reachedCutoff } = r.value

      const hit = items.filter(item =>
        item.stockName.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q)     ||
        item.firm.toLowerCase().includes(q),
      )
      matches.push(...hit)

      if (reachedCutoff) done = true   // 다음 배치는 불필요
    }
  }

  return NextResponse.json(
    { items: matches, total: matches.length },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
