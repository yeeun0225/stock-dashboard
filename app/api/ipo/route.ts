import { NextResponse } from 'next/server'

export const revalidate = 1800  // 30분 캐시

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export interface IpoItem {
  name:               string   // 종목명
  market:             string   // 코스닥/코스피
  securities:         string   // 주관사
  offeringPrice:      string   // 공모가 (확정가 or 희망범위)
  subscribeStart:     string   // 청약시작 YYYY-MM-DD
  subscribeEnd:       string   // 청약종료 YYYY-MM-DD
  listingDate:        string   // 상장예정일 YYYY-MM-DD
  institutionalRatio: string   // 기관경쟁률 (네이버는 미제공)
  subscriptionRatio:  string   // 개인청약경쟁률
}

export interface IpoData {
  items:     IpoItem[]
  timestamp: number
}

// ── EUC-KR 페이지 fetch ───────────────────────────────────────
async function fetchEucKr(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://finance.naver.com/',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return new TextDecoder('euc-kr').decode(buf)
  } catch {
    return null
  }
}

// ── li 블록에서 <span class="num"> 텍스트 추출 ────────────────
// String.raw 사용: template literal 내 \s\S 가 백슬래시를 잃지 않도록
function getNum(block: string, liClass: string): string {
  const m = block.match(
    new RegExp(String.raw`<li class="${liClass}"[\s\S]*?<span class="num">([\s\S]*?)<\/span>`)
  )
  return m?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() ?? ''
}

// ── li 블록에서 </em> 이후 텍스트 추출 (span 없는 필드용) ────
function getText(block: string, liClass: string): string {
  const m = block.match(
    new RegExp(String.raw`<li class="${liClass}"[\s\S]*?<\/em>([\s\S]*?)(?:<(?:button|li|ul|\/ul|\/li)[\s>])`)
  )
  return m?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() ?? ''
}

// ── YY.MM.DD → YYYY-MM-DD ────────────────────────────────────
function parseYY(s: string): string {
  const m = s.trim().match(/^(\d{2})\.(\d{2})\.(\d{2})$/)
  return m ? `20${m[1]}-${m[2]}-${m[3]}` : ''
}

// ── "26.05.22~05.26" → [subscribeStart, subscribeEnd] ────────
function parseSubscribeDates(raw: string): [string, string] {
  // 두 가지 포맷: "YY.MM.DD~MM.DD" 또는 "YY.MM.DD~YY.MM.DD"
  const m = raw.trim().match(
    /^(\d{2})\.(\d{2})\.(\d{2})\s*~\s*(?:(\d{2})\.)?(\d{2})\.(\d{2})$/
  )
  if (!m) return ['', '']
  const y     = `20${m[1]}`
  const start = `${y}-${m[2]}-${m[3]}`
  const endY  = m[4] ? `20${m[4]}` : y
  const end   = `${endY}-${m[5]}-${m[6]}`
  return [start, end]
}

// ── 네이버 증권 IPO 페이지 파싱 ──────────────────────────────
function parseNaver(html: string): IpoItem[] {
  const items: IpoItem[] = []

  // 각 종목 블록: <div class="item_area" id="A...">
  const blockRe = /<div class="item_area"[^>]*id="([^"]+)">([\s\S]*?)(?=<div class="item_area"|<\/tbody>)/g
  let m: RegExpExecArray | null

  while ((m = blockRe.exec(html)) !== null) {
    const block = m[2]

    // 시장 구분 (코스닥 / 코스피)
    const marketM = block.match(/<span class="type">([^<]+)<\/span>/)
    const market  = marketM?.[1]?.trim() ?? ''

    // 종목명
    const nameM = block.match(/<h4 class="item_name">[\s\S]*?<a [^>]*>([^<]+)<\/a>/)
    const name  = nameM?.[1]?.trim() ?? ''
    if (!name) continue

    // 공모가 ("2,000" or "12,400~14,800")
    const offeringPrice = getNum(block, 'area_price')

    // 주관사 (span 없이 텍스트로 제공)
    const securities = getText(block, 'area_sup')

    // 개인청약경쟁률 ("1,468.88:1")
    const subscriptionRatio = getNum(block, 'area_competition')

    // 청약 기간 ("26.05.22~05.26")
    const privRaw = getNum(block, 'area_private')
    const [subscribeStart, subscribeEnd] = parseSubscribeDates(privRaw)

    // 상장일 ("26.06.05")
    const listRaw    = getNum(block, 'area_list')
    const listingDate = parseYY(listRaw)

    // 날짜 정보가 하나도 없으면 skip (예심청구 등 초기 단계)
    if (!subscribeStart && !listingDate) continue

    items.push({
      name,
      market,
      securities,
      offeringPrice,
      subscribeStart,
      subscribeEnd,
      listingDate,
      institutionalRatio: '',   // 네이버는 기관경쟁률 미제공
      subscriptionRatio,
    })
  }

  return items
}

// ── GET ──────────────────────────────────────────────────────
export async function GET() {
  const html = await fetchEucKr('https://finance.naver.com/sise/ipo.nhn')

  if (!html) {
    return NextResponse.json<IpoData>(
      { items: [], timestamp: Date.now() },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const items = parseNaver(html)

  return NextResponse.json<IpoData>(
    { items, timestamp: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
