import type { StockDef, SectorGroup } from './kr-stocks'

export type { StockDef, SectorGroup }

export const JP_SECTORS: SectorGroup[] = [
  {
    sector: '자동차/부품',
    stocks: [
      { name: '토요타', ticker: '7203.T' },
      { name: '혼다', ticker: '7267.T' },
      { name: '스즈키', ticker: '7269.T' },
      { name: '덴소', ticker: '6902.T' },
      { name: '브리지스톤', ticker: '5108.T' },
    ],
  },
  {
    sector: '반도체',
    stocks: [
      { name: 'Kioxia', ticker: '285A.T' },
      { name: '르네사스', ticker: '6723.T' },
    ],
  },
  {
    sector: '반도체장비',
    stocks: [
      { name: '도쿄일렉트론', ticker: '8035.T' },
      { name: '어드반테스트', ticker: '6857.T' },
      { name: '디스코', ticker: '6146.T' },
      { name: '레이져테크', ticker: '6920.T' },
    ],
  },
  {
    sector: '전자/부품',
    stocks: [
      { name: '무라타', ticker: '6981.T' },
      { name: 'TDK', ticker: '6762.T' },
      { name: '이비덴', ticker: '4062.T' },
      { name: '교세라', ticker: '6971.T' },
      { name: '스미토모전기', ticker: '5802.T' },
      { name: '후지쿠라', ticker: '5803.T' },
      { name: '후루카와전기', ticker: '5801.T' },
    ],
  },
  {
    sector: '전자/기기',
    stocks: [
      { name: '소니', ticker: '6758.T' },
      { name: '파나소닉', ticker: '6752.T' },
      { name: '캐논', ticker: '7751.T' },
      { name: '후지필름', ticker: '4901.T' },
      { name: '호야', ticker: '7741.T' },
    ],
  },
  {
    sector: '산업자동화',
    stocks: [
      { name: '키엔스', ticker: '6861.T' },
      { name: '화낙', ticker: '6954.T' },
      { name: '에스엠씨', ticker: '6273.T' },
      { name: '다이킨', ticker: '6367.T' },
      { name: '히타치', ticker: '6501.T' },
      { name: '미쓰비시전기', ticker: '6503.T' },
      { name: '코마츠', ticker: '6301.T' },
      { name: '하모닉드라이브', ticker: '6324.T' },
    ],
  },
  {
    sector: 'IT/통신',
    stocks: [
      { name: '리쿠르트', ticker: '6098.T' },
      { name: '후지쯔', ticker: '6702.T' },
      { name: 'NEC', ticker: '6701.T' },
      { name: 'NTT', ticker: '9432.T' },
      { name: 'KDDI', ticker: '9433.T' },
      { name: '소프트뱅크', ticker: '9434.T' },
    ],
  },
  {
    sector: '종합상사',
    stocks: [
      { name: '미쓰비시상사', ticker: '8058.T' },
      { name: '미쓰이물산', ticker: '8031.T' },
      { name: '이토추', ticker: '8001.T' },
      { name: '마루베니', ticker: '8002.T' },
      { name: '스미토모상사', ticker: '8053.T' },
      { name: '도요타통상', ticker: '8015.T' },
    ],
  },
  {
    sector: '금융/은행',
    stocks: [
      { name: '미쓰비시UFJ', ticker: '8306.T' },
      { name: '스미토모미쓰이FG', ticker: '8316.T' },
      { name: '미즈호FG', ticker: '8411.T' },
      { name: '리소나', ticker: '8308.T' },
      { name: '스미토모트러스트', ticker: '8309.T' },
      { name: '오릭스', ticker: '8591.T' },
      { name: '노무라', ticker: '8604.T' },
      { name: '일본우정', ticker: '6178.T' },
    ],
  },
  {
    sector: '보험',
    stocks: [
      { name: '도쿄마린', ticker: '8766.T' },
      { name: 'MS&AD', ticker: '8725.T' },
      { name: '다이이치라이프', ticker: '8750.T' },
      { name: '솜포', ticker: '8630.T' },
    ],
  },
  {
    sector: '바이오/제약',
    stocks: [
      { name: '주가이제약', ticker: '4519.T' },
      { name: '다케다제약', ticker: '4502.T' },
      { name: '오츠카HD', ticker: '4578.T' },
      { name: '다이이찌산쿄', ticker: '4568.T' },
      { name: '아스텔라스', ticker: '4503.T' },
      { name: '테루모', ticker: '4543.T' },
    ],
  },
  {
    sector: '화학/소재',
    stocks: [
      { name: '신에츠화학', ticker: '4063.T' },
      { name: '레조낙', ticker: '4004.T' },
    ],
  },
  {
    sector: '유통/소비재',
    stocks: [
      { name: '패스트리테일링', ticker: '9983.T' },
      { name: '세븐&아이', ticker: '3382.T' },
      { name: '이온', ticker: '8267.T' },
      { name: '재팬토바코', ticker: '2914.T' },
      { name: '아지노모토', ticker: '2802.T' },
    ],
  },
  {
    sector: '부동산',
    stocks: [
      { name: '미쓰비시부동산', ticker: '8802.T' },
      { name: '미쓰이부동산', ticker: '8801.T' },
      { name: '스미토모부동산', ticker: '8830.T' },
    ],
  },
  {
    sector: '중공업/방산',
    stocks: [
      { name: '미쓰비시중공업', ticker: '7011.T' },
      { name: 'IHI', ticker: '7013.T' },
    ],
  },
  {
    sector: '에너지',
    stocks: [
      { name: '국제석유개발', ticker: '1605.T' },
      { name: 'ENEOS', ticker: '5020.T' },
    ],
  },
  {
    sector: '철도/운송',
    stocks: [
      { name: '동일본철도', ticker: '9020.T' },
      { name: '도카이철도', ticker: '9022.T' },
    ],
  },
  {
    sector: '엔터테인먼트',
    stocks: [
      { name: '닌텐도', ticker: '7974.T' },
      { name: '오리엔탈랜드', ticker: '4661.T' },
    ],
  },
  {
    sector: '지주/투자',
    stocks: [
      { name: '소프트뱅크그룹', ticker: '9984.T' },
    ],
  },
  {
    sector: '건설',
    stocks: [
      { name: '가지마', ticker: '1812.T' },
    ],
  },
]

export const ALL_JP_TICKERS = JP_SECTORS.flatMap((s) =>
  s.stocks.map((st) => st.ticker)
)
