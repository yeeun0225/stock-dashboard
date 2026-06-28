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

  // ── 추가 요청 ETF ──────────────────────────────────────────
  { name: 'SOL AI반도체TOP2플러스', ticker: '0167A0.KS' },
  { name: 'PLUS 글로벌HBM반도체', ticker: '442580.KS' },
  { name: 'KODEX 미국AI광통신네트워크', ticker: '0173Y0.KS' },
  { name: 'PLUS 일본반도체소부장', ticker: '464920.KS' },
  { name: 'ACE 일본반도체', ticker: '469160.KS' },
  { name: 'SOL 반도체전공정', ticker: '475300.KS' },
  { name: 'SOL 반도체후공정', ticker: '475310.KS' },
  { name: 'KODEX 원자력SMR', ticker: '0098F0.KS' },
  { name: 'TIGER 코리아AI전력기기TOP3플러스', ticker: '0117V0.KS' },
  { name: 'KIWOOM 미국S&P500모멘텀', ticker: '0137V0.KS' },
  { name: 'TIME 미국나스닥100액티브', ticker: '426030.KS' },
  { name: 'TIME 코스닥액티브', ticker: '0162Y0.KS' },
  { name: 'TIME 글로벌AI인공지능액티브', ticker: '456600.KS' },
  { name: 'TIGER 미국우주테크', ticker: '0183J0.KS' },
  { name: 'ACE 미국우주테크액티브', ticker: '0180V0.KS' },
  { name: 'TIME 글로벌우주테크&방산액티브', ticker: '478150.KS' },
  { name: 'TIGER 미국필라델피아AI반도체나스닥', ticker: '497570.KS' },
  { name: 'TIGER 반도체TOP10', ticker: '396500.KS' },
  { name: 'TIGER 미국AI빅테크10', ticker: '490090.KS' },
  { name: 'ACE 미국빅테크TOP7 Plus', ticker: '465580.KS' },
  { name: 'KODEX 삼성전자채권혼합', ticker: '448330.KS' },
  { name: 'PLUS 금채권혼합', ticker: '0138Y0.KS' },
  { name: 'TIGER 테슬라채권혼합Fn', ticker: '447770.KS' },
  { name: 'PLUS 고배당주', ticker: '161510.KS' },
  { name: 'RISE 삼성그룹Top3채권혼합', ticker: '448630.KS' },
  { name: 'KODEX 삼성전자SK하이닉스채권혼합50', ticker: '0177N0.KS' },
  { name: 'KODEX 200미국채혼합', ticker: '284430.KS' },
  { name: 'TIME 미국나스닥100채권혼합50액티브', ticker: '0019K0.KS' },

  // ── 한국 레버리지 ──────────────────────────────────────────
  { name: 'TIGER SK하이닉스단일종목레버리지', ticker: '0195S0.KS' },
  { name: 'TIGER 삼성전자단일종목레버리지', ticker: '0195R0.KS' },
  { name: 'KODEX SK하이닉스단일종목레버리지', ticker: '0193T0.KS' },
  { name: 'KODEX 삼성전자단일종목레버리지', ticker: '0193W0.KS' },
]

// 미국 레버리지/인버스 ETF (토스에 있으나 한글명 미제공 → 직접 지정)
export const US_LEVERAGED_ETFS: { name: string; englishName: string; ticker: string }[] = [
  { name: 'TQQQ (나스닥100 3배)', englishName: 'ProShares UltraPro QQQ', ticker: 'TQQQ' },
  { name: 'QLD (나스닥100 2배)', englishName: 'ProShares Ultra QQQ', ticker: 'QLD' },
  { name: 'SOXL (반도체 3배)', englishName: 'Direxion Daily Semiconductor Bull 3X', ticker: 'SOXL' },
  { name: 'SOXS (반도체 인버스 3배)', englishName: 'Direxion Daily Semiconductor Bear 3X', ticker: 'SOXS' },
  { name: 'MUU (마이크론 2배)', englishName: 'Direxion Daily MU Bull 2X ETF', ticker: 'MUU' },
  { name: 'SNXX (샌디스크 2배)', englishName: 'Tradr 2X Long SNDK Daily ETF', ticker: 'SNXX' },
  { name: 'TSLL (테슬라 2배)', englishName: 'Direxion Daily TSLA Bull 2X ETF', ticker: 'TSLL' },
  { name: 'NVDL (엔비디아 2배)', englishName: 'GraniteShares 2x Long NVDA Daily', ticker: 'NVDL' },
  { name: 'AMDL (AMD 2배)', englishName: 'GraniteShares 2x Long AMD Daily', ticker: 'AMDL' },
]

// 일본 대표 지수 ETF (토스 미지원 → 야후 파이낸스 시세 사용)
// 종목명은 야후가 운용사명만 주므로 직접 지정
export const JP_ETFS: { name: string; englishName: string; ticker: string }[] = [
  { name: 'TOPIX ETF (노무라)', englishName: 'NEXT FUNDS TOPIX ETF', ticker: '1306.T' },
  { name: '닛케이225 ETF (노무라)', englishName: 'NEXT FUNDS Nikkei225 ETF', ticker: '1321.T' },
]
