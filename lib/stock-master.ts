/**
 * 종목 검색 마스터
 * - kr-stocks(한글명 보유) + us-stocks(영문명)를 통합한 검색 인덱스
 * - 미국 종목의 한글명은 토스 stocks API로 1회 보강(enrich)하여 캐시
 * - 한글명·영문명·티커(야후/토스) 모두 부분 매칭 검색 지원
 */
import { KR_SECTORS } from './kr-stocks'
import { US_SECTORS } from './us-stocks'
import { JP_SECTORS } from './jp-stocks'
import { KR_ETFS, JP_ETFS, US_LEVERAGED_ETFS } from './kr-etfs'
import { fetchTossStockInfos } from './toss'

export interface StockMasterEntry {
  ticker: string // 야후 티커 (005930.KS, AAPL) — watchlist/quote 호출용
  tossSymbol: string // 토스 심볼 (005930, AAPL)
  name: string // 표시명 (한글 우선)
  englishName: string // 영문명
  market: 'KR' | 'US' | 'JP'
}

// 야후 티커 → 토스 심볼 (005930.KS → 005930, AAPL → AAPL)
function toTossSymbol(ticker: string): string {
  return ticker.split('.')[0]
}

let masterCache: StockMasterEntry[] | null = null
let masterBuildPromise: Promise<StockMasterEntry[]> | null = null

async function buildMaster(): Promise<StockMasterEntry[]> {
  // 1) KR — kr-stocks(종목) + kr-etfs(ETF), 둘 다 한글명 보유
  const krEntries: StockMasterEntry[] = [
    ...KR_SECTORS.flatMap((sg) => sg.stocks),
    ...KR_ETFS,
  ].map((st) => ({
    ticker: st.ticker,
    tossSymbol: toTossSymbol(st.ticker),
    name: st.name,
    englishName: '',
    market: 'KR' as const,
  }))

  // 1-2) JP — 일본 히트맵 종목(한글명 보유) + 대표 ETF. 토스 미지원이라 야후 시세
  const jpStockEntries: StockMasterEntry[] = JP_SECTORS.flatMap((sg) =>
    sg.stocks.map((st) => ({
      ticker: st.ticker,
      tossSymbol: st.ticker, // 토스 미사용
      name: st.name,
      englishName: '',
      market: 'JP' as const,
    }))
  )
  const jpEtfEntries: StockMasterEntry[] = JP_ETFS.map((e) => ({
    ticker: e.ticker,
    tossSymbol: e.ticker,
    name: e.name,
    englishName: e.englishName,
    market: 'JP' as const,
  }))
  const jpEntries = [...jpStockEntries, ...jpEtfEntries]

  // 2) US — 영문명 보유, 토스로 한글명 보강
  const usBase = US_SECTORS.flatMap((sg) =>
    sg.stocks.map((st) => ({
      ticker: st.ticker,
      tossSymbol: toTossSymbol(st.ticker),
      englishName: st.name,
      market: 'US' as const,
    }))
  )

  // 미국 레버리지 ETF (한글 별칭 직접 지정 — 토스가 한글명 미제공)
  const usLevEntries: StockMasterEntry[] = US_LEVERAGED_ETFS.map((e) => ({
    ticker: e.ticker,
    tossSymbol: e.ticker,
    name: e.name,
    englishName: e.englishName,
    market: 'US' as const,
  }))

  let usEntries: StockMasterEntry[] = usBase.map((e) => ({
    ...e,
    name: e.englishName, // 폴백: 영문명
  }))

  try {
    const usSymbols = usBase.map((e) => e.tossSymbol)
    const infos = await fetchTossStockInfos(usSymbols)
    usEntries = usBase.map((e) => {
      const info = infos.get(e.tossSymbol)
      return {
        ...e,
        name: info?.name || e.englishName, // 토스 한글명 우선, 없으면 영문명
        englishName: info?.englishName || e.englishName,
      }
    })
  } catch (err) {
    console.error('[stock-master] US enrich 실패, 영문명으로 폴백:', err)
  }

  return [...krEntries, ...jpEntries, ...usLevEntries, ...usEntries]
}

// 야후 티커 변환: 토스 market → 야후 접미사
function tossToYahooTicker(symbol: string, market: string): string {
  if (market === 'KOSPI' || market === 'KR_ETC') return `${symbol}.KS`
  if (market === 'KOSDAQ') return `${symbol}.KQ`
  return symbol // 미국은 그대로
}

// 검색 폴백: 입력값을 토스 심볼로 직접 조회 (마스터에 없는 ETF/종목까지)
export async function searchTossDirect(query: string): Promise<StockMasterEntry | null> {
  const sym = query.trim().toUpperCase()
  // 한글 등 심볼이 될 수 없는 입력은 스킵 (토스는 이름 검색 미지원)
  if (!/^[A-Z0-9.\-]+$/.test(sym)) return null
  const tossSym = sym.split('.')[0]
  try {
    const infos = await fetchTossStockInfos([tossSym])
    const info = infos.get(tossSym)
    if (!info) return null
    return {
      ticker: tossToYahooTicker(tossSym, info.market),
      tossSymbol: tossSym,
      name: info.name,
      englishName: info.englishName,
      market: info.market.startsWith('KO') || info.market === 'KR_ETC' ? 'KR' : 'US',
    }
  } catch {
    return null
  }
}

async function getMaster(): Promise<StockMasterEntry[]> {
  if (masterCache) return masterCache
  if (masterBuildPromise) return masterBuildPromise
  masterBuildPromise = buildMaster().then((m) => {
    masterCache = m
    masterBuildPromise = null
    return m
  })
  return masterBuildPromise
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '')
}

export async function searchStocks(
  query: string,
  limit = 20
): Promise<StockMasterEntry[]> {
  const q = normalize(query)
  if (!q) return []

  const master = await getMaster()
  const scored: { entry: StockMasterEntry; score: number }[] = []

  for (const entry of master) {
    const name = normalize(entry.name)
    const eng = normalize(entry.englishName)
    const ticker = normalize(entry.ticker)
    const toss = normalize(entry.tossSymbol)

    let score = 0
    // 정확 일치 / 시작 일치에 높은 점수
    if (ticker === q || toss === q) score = 100
    else if (name === q || eng === q) score = 95
    else if (ticker.startsWith(q) || toss.startsWith(q)) score = 80
    else if (name.startsWith(q) || eng.startsWith(q)) score = 75
    else if (name.includes(q) || eng.includes(q)) score = 50
    else if (ticker.includes(q) || toss.includes(q)) score = 40

    if (score > 0) scored.push({ entry, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.entry)
}
