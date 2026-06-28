import type { StockDef } from './kr-stocks'

// 인기 한국 ETF (토스 stocks API 로 검증된 티커·한글명)
// 관심종목 한글/티커 검색용 — 히트맵에는 포함하지 않음
export const KR_ETFS: StockDef[] = [
  { name: 'KODEX 200', ticker: '069500.KS' },
  { name: 'TIGER 200', ticker: '102110.KS' },
  { name: 'KODEX 레버리지', ticker: '122630.KS' },
  { name: 'KODEX 인버스', ticker: '114800.KS' },
  { name: 'KODEX 코스닥150', ticker: '229200.KS' },
  { name: 'TIGER 코스닥150', ticker: '232080.KS' },
  { name: 'TIGER 미국나스닥100', ticker: '133690.KS' },
  { name: 'KODEX 미국나스닥100', ticker: '379810.KS' },
  { name: 'TIGER 미국S&P500', ticker: '360750.KS' },
  { name: 'KODEX 미국S&P500', ticker: '379800.KS' },
  { name: 'TIGER 미국필라델피아반도체나스닥', ticker: '381180.KS' },
  { name: 'TIGER 미국테크TOP10 INDXX', ticker: '381170.KS' },
  { name: 'TIGER 미국배당다우존스', ticker: '458730.KS' },
  { name: 'SOL 미국배당다우존스', ticker: '446720.KS' },
  { name: 'ACE 미국WideMoat동일가중', ticker: '309230.KS' },
  { name: 'KODEX 미국AI전력핵심인프라', ticker: '487230.KS' },
  { name: 'KODEX 반도체', ticker: '091160.KS' },
  { name: 'KODEX 은행', ticker: '091170.KS' },
  { name: 'KODEX 2차전지산업', ticker: '305720.KS' },
  { name: 'SOL 조선TOP3플러스', ticker: '466920.KS' },
  { name: 'PLUS K방산', ticker: '449450.KS' },
  { name: 'TIGER 차이나전기차SOLACTIVE', ticker: '371460.KS' },
  { name: 'TIGER 차이나CSI300', ticker: '192090.KS' },
  { name: 'TIGER 유로스탁스50(합성 H)', ticker: '195930.KS' },
  { name: 'KODEX 종합채권(AA-이상)액티브', ticker: '273130.KS' },
  { name: 'KODEX 단기채권', ticker: '153130.KS' },
  { name: 'KODEX 미국30년국채울트라선물(H)', ticker: '304660.KS' },
  { name: 'ACE KRX금현물', ticker: '411060.KS' },
  { name: 'KODEX 골드선물(H)', ticker: '132030.KS' },
  { name: 'KODEX 미국달러선물', ticker: '261240.KS' },
  { name: 'KODEX 한국부동산리츠인프라', ticker: '476800.KS' },
  { name: 'HANARO Fn K-푸드', ticker: '438900.KS' },
  { name: 'ACE 엔비디아채권혼합', ticker: '448540.KS' },
  { name: 'KODEX 테슬라커버드콜채권혼합액티브', ticker: '475080.KS' },
]

// 일본 대표 지수 ETF (토스 미지원 → 야후 파이낸스 시세 사용)
// 종목명은 야후가 운용사명만 주므로 직접 지정
export const JP_ETFS: { name: string; englishName: string; ticker: string }[] = [
  { name: 'TOPIX ETF (노무라)', englishName: 'NEXT FUNDS TOPIX ETF', ticker: '1306.T' },
  { name: '닛케이225 ETF (노무라)', englishName: 'NEXT FUNDS Nikkei225 ETF', ticker: '1321.T' },
]
