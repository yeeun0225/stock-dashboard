import { NextResponse } from 'next/server'

export const revalidate = 1800  // 30분 캐시

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export interface IpoItem {
  name:               string   // 종목명
  market:             string   // 코스피/코스닥
  securities:         string   // 주간사
  offeringPrice:      string   // 공모가 (확정 or 희망범위)
  subscribeStart:     string   // 청약시작 YYYY-MM-DD
  subscribeEnd:       string   // 청약종료 YYYY-MM-DD
  listingDate:        string   // 상장예정일 YYYY-MM-DD
  institutionalRatio: string   // 기관경쟁률
  subscriptionRatio:  string   // 청약경쟁률
}

export interface IpoData {
  items:     IpoItem[]
  timestamp: number
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Referer: 'https://www.38.co.kr/',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    // EUC-KR 우선 (38.co.kr)
    let html = ''
    try {
      const utf8 = new TextDecoder('utf-8').decode(buf)
      const garbled = (utf8.match(/�/g) ?? []).length
      html = garbled > 5
        ? new TextDecoder('euc-kr').decode(buf)
        : utf8
    } catch {
      html = new TextDecoder('euc-kr', { fatal: false }).decode(buf)
    }
    return html
  } catch {
    return null
  }
}

// ── YYYY.MM.DD 또는 YY.MM.DD → YYYY-MM-DD ───────────────────
function parseDate(s: string): string {
  const m = s.trim().match(/^(\d{2,4})\.(\d{2})\.(\d{2})$/)
  if (!m) return ''
  const y = m[1].length === 2 ? `20${m[1]}` : m[1]
  return `${y}-${m[2]}-${m[3]}`
}

// ── 38.co.kr fund 테이블 파싱 ────────────────────────────────
function parse38(html: string): IpoItem[] {
  const items: IpoItem[] = []
  const seen = new Set<string>()

  // tbody 내 tr 행 순회
  const tbodyM = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  const tbody  = tbodyM?.[1] ?? html

  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowM: RegExpExecArray | null

  while ((rowM = rowRe.exec(tbody)) !== null) {
    const row = rowM[1]

    // td 셀 추출
    const cells: string[] = []
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let cellM: RegExpExecArray | null
    while ((cellM = cellRe.exec(row)) !== null) {
      cells.push(decodeHtml(cellM[1]))
    }
    if (cells.length < 4) continue

    // 종목명: 한글 포함, 2자 이상
    const name = cells[0]
    if (!name || !/[가-힣]/.test(name) || name.length < 2) continue
    if (seen.has(name)) continue
    seen.add(name)

    // 시장 구분 (코스피/코스닥/코넥스)
    const marketCell = cells.find(c => /코스[피닥]|KOSPI|KOSDAQ|코넥스/i.test(c)) ?? ''
    const market = marketCell.match(/코스[피닥]|KOSPI|KOSDAQ|코넥스/i)?.[0] ?? ''

    // 날짜 패턴 "YYYY.MM.DD~MM.DD" 또는 "YYYY.MM.DD~YYYY.MM.DD"
    const dateCell = cells.find(c => /\d{4}\.\d{2}\.\d{2}/.test(c)) ?? ''
    const dateM = dateCell.match(
      /(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(?:(\d{4})\.)?(\d{2})\.(\d{2})/,
    )
    let subscribeStart = '', subscribeEnd = ''
    if (dateM) {
      subscribeStart = `${dateM[1]}-${dateM[2]}-${dateM[3]}`
      const endYear  = dateM[4] ?? dateM[1]
      subscribeEnd   = `${endYear}-${dateM[5]}-${dateM[6]}`
    } else {
      continue  // 날짜 없으면 skip
    }

    // 상장예정일: subscribeEnd 이후 날짜
    const afterSubscribe = cells.slice(cells.indexOf(dateCell) + 1)
    const listingCell = afterSubscribe.find(c => /\d{4}\.\d{2}\.\d{2}/.test(c)) ?? ''
    const listingDate = parseDate(listingCell.match(/\d{4}\.\d{2}\.\d{2}/)?.[0] ?? '')

    // 공모가: 확정가 우선, 없으면 희망범위
    const priceCell = cells.find(c => /\d{1,3},\d{3}/.test(c)) ?? ''
    const rangeM    = priceCell.match(/(\d{1,3}(?:,\d{3})+)(?:\s*~\s*(\d{1,3}(?:,\d{3})+))?/)
    const offeringPrice = rangeM
      ? (rangeM[2] ? `${rangeM[1]}~${rangeM[2]}` : rangeM[1])
      : ''

    // 기관경쟁률 / 청약경쟁률
    const ratios  = cells.filter(c => /[\d,]+\.?\d*\s*:\s*1/.test(c))
    const institutionalRatio = ratios[0]?.match(/([\d,]+\.?\d*\s*:\s*1)/)?.[1] ?? ''
    const subscriptionRatio  = ratios[1]?.match(/([\d,]+\.?\d*\s*:\s*1)/)?.[1] ?? ''

    // 주간사
    const secCell = cells.find(c => /증권|투자/.test(c) && c.length < 40) ?? ''
    const securities = secCell

    items.push({
      name,
      market,
      securities,
      offeringPrice,
      subscribeStart,
      subscribeEnd,
      listingDate,
      institutionalRatio,
      subscriptionRatio,
    })
  }

  return items
}

// ── GET ──────────────────────────────────────────────────────
export async function GET() {
  const html = await fetchPage('https://www.38.co.kr/html/fund/?lt=1')

  if (!html) {
    return NextResponse.json<IpoData>(
      { items: [], timestamp: Date.now() },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const items = parse38(html)

  return NextResponse.json<IpoData>(
    { items, timestamp: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
