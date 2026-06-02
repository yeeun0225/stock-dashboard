'use client'

import { useState } from 'react'

// ── 탭 정의 ──────────────────────────────────────────────────
const TABS = [
  { id: 'glossary', label: '주식 용어집', emoji: '📖' },
  { id: 'pension',  label: '연금 가이드', emoji: '🏦' },
  { id: 'chart',    label: '차트 보는법', emoji: '📊' },
] as const
type TabId = typeof TABS[number]['id']

// ── 주식 용어집 데이터 ────────────────────────────────────────
const GLOSSARY: { num: number; term: string; desc: string; category: string }[] = [
  // 경제 기초
  { num: 1,   term: '금리',            category: '경제 기초', desc: '돈을 빌린 대가로 지불하는 이자율. 경제의 온도계.' },
  { num: 2,   term: '기준금리',        category: '경제 기초', desc: '중앙은행이 결정하는 금리의 기준점. 기준금리가 오르면 대출 이자가 오르고, 내리면 이자가 낮아짐.' },
  { num: 3,   term: '인플레이션',      category: '경제 기초', desc: '물가는 오르고 화폐 가치는 떨어지는 현상.' },
  { num: 4,   term: '디플레이션',      category: '경제 기초', desc: '물가는 내리고 경제 활동이 위축되는 현상.' },
  { num: 5,   term: '스태그플레이션',  category: '경제 기초', desc: '경기 불황 속에서도 물가가 계속 오르는 악순환.' },
  { num: 6,   term: 'GDP',            category: '경제 기초', desc: '국내총생산. 나라 전체의 경제 성적표.' },
  { num: 7,   term: '환율',            category: '경제 기초', desc: '국가 간 화폐를 교환할 때의 비율. 달러/원 환율이 오르면 수입 물가가 비싸짐.' },
  { num: 8,   term: '양적완화 (QE)',   category: '경제 기초', desc: '중앙은행이 시장에 돈을 직접 풀어 경기를 살리는 것. QE(돈 풀기) → 자산 가격 상승에 우호적.' },
  { num: 9,   term: '테이퍼링',        category: '경제 기초', desc: '시중에 푸는 돈의 양을 점점 줄여나가는 것.' },
  { num: 10,  term: 'CPI',            category: '경제 기초', desc: '소비자물가지수. 예상치보다 높으면 금리 인상 우려 / 낮으면 금리 인하 기대. 발표날 시장 변동이 매우 큼.' },
  { num: 11,  term: 'FOMC',           category: '경제 기초', desc: '미국이 금리를 정하는 회의. 1년에 8번 열림. 금리 인상·동결·인하를 결정하며, 세계 자금 흐름을 좌지우지하는 가장 중요한 이벤트.' },
  { num: 12,  term: '금리 인상 / 인하', category: '경제 기초', desc: '돈의 가격을 조절하는 정책. 금리 인상 → 주식 약세 / 금리 인하 → 주식 강세. 소비·대출·부동산 등 경제 전반에 영향.' },
  { num: 13,  term: 'QE / QT',        category: '경제 기초', desc: '시장의 돈을 넣고 빼는 정책. QE(돈 풀기) → 자산 상승 우호적 / QT(돈 회수) → 시장 흔들림, 성장주 부담. 유동성 흐름이 주식 방향을 거의 결정.' },
  // 주식 시장 기초
  { num: 14,  term: '주식',            category: '주식 시장 기초', desc: '기업의 소유권을 잘게 나눈 것. 주식을 사면 그 기업의 주주(공동 소유자)가 됩니다.' },
  { num: 15,  term: '주가',            category: '주식 시장 기초', desc: '주식 1주의 현재 가격. 수요와 공급에 따라 실시간으로 변합니다.' },
  { num: 16,  term: '시가총액',        category: '주식 시장 기초', desc: '기업의 전체 가치 (주가 × 주식 수). 예: 주가 5만 원 × 1억 주 = 시가총액 5조 원.' },
  { num: 17,  term: '코스피 (KOSPI)', category: '주식 시장 기초', desc: '한국의 대기업 중심 종합주가지수. 삼성전자, 현대차, SK하이닉스 등.' },
  { num: 18,  term: '코스닥 (KOSDAQ)', category: '주식 시장 기초', desc: '중소·벤처기업 중심의 주식 시장 지수. 상대적으로 변동성이 큼.' },
  { num: 19,  term: '상장 (IPO)',      category: '주식 시장 기초', desc: '기업의 주식을 일반인이 거래할 수 있게 공개하는 것.' },
  { num: 20,  term: '상장폐지',        category: '주식 시장 기초', desc: '거래소에서 주식이 거래될 자격을 잃는 것.' },
  // 주식 종류
  { num: 21,  term: '보통주',          category: '주식 종류', desc: '의결권이 있는 일반적인 주식.' },
  { num: 22,  term: '우선주',          category: '주식 종류', desc: '의결권은 없지만 배당을 더 많이 받는 주식.' },
  { num: 23,  term: 'ETF',            category: '주식 종류', desc: '상장지수펀드. 여러 주식을 묶어 주식처럼 거래하는 펀드. S&P500 ETF를 사면 미국 대표 500개 기업에 분산 투자하는 효과.' },
  { num: 24,  term: '우량주',          category: '주식 종류', desc: '수익성이 높고 재무 구조가 탄탄한 큰 기업의 주식.' },
  { num: 25,  term: '테마주',          category: '주식 종류', desc: '특정 이슈에 따라 단기적으로 급등락하는 주식군.' },
  { num: 26,  term: '작전주',          category: '주식 종류', desc: '특정 세력이 인위적으로 주가를 조작하는 주식. 투자 위험 매우 높음.' },
  // 가격 지표
  { num: 27,  term: '시가 (Open)',     category: '가격 지표', desc: '장 시작할 때 처음 거래된 주가.' },
  { num: 28,  term: '종가 (Close)',    category: '가격 지표', desc: '장 마감할 때 마지막으로 거래된 주가.' },
  { num: 29,  term: '고가 / 저가',     category: '가격 지표', desc: '하루 중 가장 높았던 가격(High) / 가장 낮았던 가격(Low).' },
  { num: 30,  term: '52주 신고가/신저가', category: '가격 지표', desc: '최근 1년(52주) 동안의 최고가 / 최저가. 주가 흐름의 기준점으로 활용.' },
  { num: 31,  term: '등락률 (%)',      category: '가격 지표', desc: '전날 종가 대비 오늘 주가의 변동 비율. 예: 전날 1만 원 → 오늘 1만 1천 원 = +10%.' },
  { num: 32,  term: '상한가 / 하한가', category: '가격 지표', desc: '하루에 주가가 오르거나 내릴 수 있는 최대 한도. 한국 시장은 ±30%.' },
  // 매매 기초
  { num: 33,  term: '매수',            category: '매매 기초', desc: '주식을 사는 것.' },
  { num: 34,  term: '매도',            category: '매매 기초', desc: '주식을 파는 것.' },
  { num: 35,  term: '호가 (Quote)',    category: '매매 기초', desc: '주식을 사고팔고 싶은 가격을 제시하는 것. 매수호가(Bid): 사려는 가격 / 매도호가(Ask): 팔려는 가격.' },
  { num: 36,  term: '시장가 주문',     category: '매매 기초', desc: '현재 거래되는 가격으로 즉시 체결하는 방식.' },
  { num: 37,  term: '지정가 주문',     category: '매매 기초', desc: '내가 원하는 가격을 정해두고 체결을 기다리는 방식.' },
  { num: 38,  term: '체결',            category: '매매 기초', desc: '매수와 매도 주문이 만나 거래가 성사되는 것.' },
  { num: 39,  term: '예수금',          category: '매매 기초', desc: '주식을 사기 위해 계좌에 넣어둔 실제 현금.' },
  { num: 40,  term: '증거금',          category: '매매 기초', desc: '주식을 살 때 계약금처럼 미리 거는 돈.' },
  { num: 41,  term: '미수금',          category: '매매 기초', desc: '증거금 제외하고 부족한 주식 대금을 빌린 상태.' },
  // 재무 지표
  { num: 42,  term: 'EPS',            category: '재무 지표', desc: '주당순이익. 기업 순이익 ÷ 발행 주식 수. 주식 1주가 벌어들이는 이익.' },
  { num: 43,  term: 'PER',            category: '재무 지표', desc: '주가수익비율. 주가 ÷ EPS. 이익 대비 주가가 적당한지 확인하는 지표. PER이 낮을수록 저평가, 높을수록 고평가.' },
  { num: 44,  term: 'PBR',            category: '재무 지표', desc: '주가순자산비율. 주가 ÷ 주당순자산. 1배 미만이면 자산 가치보다 싸게 거래되고 있다는 의미.' },
  { num: 45,  term: 'ROE',            category: '재무 지표', desc: '자기자본이익률. 순이익 ÷ 자기자본 × 100. 내 돈으로 얼마나 수익을 냈나.' },
  { num: 46,  term: '배당금',          category: '재무 지표', desc: '기업의 이익을 주주들에게 나눠주는 돈.' },
  { num: 47,  term: '배당수익률',      category: '재무 지표', desc: '투자 금액 대비 받는 배당금의 비율. 예: 주가 10만 원, 연간 배당금 3천 원 → 배당수익률 3%.' },
  { num: 48,  term: '배당성향',        category: '재무 지표', desc: '이익 중 얼마나 배당으로 주는지 보여주는 비율.' },
  { num: 49,  term: '재무제표',        category: '재무 지표', desc: '기업의 성적표 (자산, 부채, 이익 기록).' },
  { num: 50,  term: '영업이익',        category: '재무 지표', desc: '순수하게 비즈니스로 벌어들인 돈.' },
  { num: 51,  term: '당기순이익',      category: '재무 지표', desc: '세금 등 다 떼고 최종적으로 남은 이익.' },
  // 기업 활동
  { num: 52,  term: '유상증자',        category: '기업 활동', desc: '주주들에게 돈을 받고 새 주식을 발행하는 것.' },
  { num: 53,  term: '무상증자',        category: '기업 활동', desc: '돈 안 받고 주주들에게 새 주식을 나눠주는 것.' },
  { num: 54,  term: '액면분할',        category: '기업 활동', desc: '주식의 액면가를 나누어 주식 수를 늘리는 것. 예: 100만 원짜리 주식을 10만 원짜리 10주로 나눔 → 소액 투자자 접근성 ↑.' },
  { num: 55,  term: '지주회사',        category: '기업 활동', desc: '다른 회사의 주식을 소유해 지배하는 회사.' },
  { num: 56,  term: '자사주 매입',     category: '기업 활동', desc: '회사가 자기 회사의 주식을 직접 사는 것. 주주 가치 제고 신호로 해석되는 경우가 많음.' },
  { num: 57,  term: '자사주 소각',     category: '기업 활동', desc: '산 주식을 없애버려 기존 주식의 가치를 높이는 것.' },
  { num: 58,  term: '배당락',          category: '기업 활동', desc: '배당받을 권리가 사라지는 시점.' },
  { num: 59,  term: '권리락',          category: '기업 활동', desc: '증자 등으로 신주를 받을 권리가 사라지는 것.' },
  // 투자 전략
  { num: 60,  term: '가치투자',        category: '투자 전략', desc: '기업의 본질 가치보다 쌀 때 사서 기다리는 투자.' },
  { num: 61,  term: '기본적 분석',     category: '투자 전략', desc: '기업의 실적이나 재무 상태를 분석하는 것.' },
  { num: 62,  term: '기술적 분석',     category: '투자 전략', desc: '차트나 거래량 등으로 미래 주가를 예측하는 것.' },
  { num: 63,  term: '분산투자',        category: '투자 전략', desc: '여러 종목에 나눠 투자해 리스크를 줄이는 법.' },
  { num: 64,  term: '적립식 투자 (DCA)', category: '투자 전략', desc: '정해진 금액을 정기적으로 꾸준히 매수하는 방식. 평균 매입 단가를 낮추는 효과.' },
  { num: 65,  term: '장기투자',        category: '투자 전략', desc: '짧은 등락에 일희일비하지 않고 오랜 시간 투자하는 것.' },
  { num: 66,  term: '단타 (데이트레이딩)', category: '투자 전략', desc: '당일에 사서 당일에 파는 초단기 투자.' },
  { num: 67,  term: '스윙',            category: '투자 전략', desc: '며칠에서 몇 주간 보유하며 수익을 노리는 투자.' },
  { num: 68,  term: '손절 (손절매)',   category: '투자 전략', desc: '손실을 감수하고 주식을 팔아 피해를 최소화하는 것.' },
  { num: 69,  term: '익절',            category: '투자 전략', desc: '이익이 났을 때 팔아서 수익을 확정 짓는 것.' },
  { num: 70,  term: '물타기',          category: '투자 전략', desc: '주가가 떨어질 때 추가 매수해 평균 단가를 낮추는 것.' },
  { num: 71,  term: '불타기',          category: '투자 전략', desc: '주가가 오를 때 추가 매수해 수익을 극대화하는 것.' },
  { num: 72,  term: '포트폴리오',      category: '투자 전략', desc: '내가 보유한 주식, 채권, 현금 등 투자 자산 전체의 구성.' },
  // 차트 / 기술 분석
  { num: 73,  term: '이동평균선',      category: '차트·기술 분석', desc: '일정 기간 주가의 평균치를 연결한 선. 5일선(단기) / 20일선(중기) / 60일선(중장기) / 120일선(장기).' },
  { num: 74,  term: '골든크로스',      category: '차트·기술 분석', desc: '단기 이동평균선이 장기 이동평균선을 뚫고 올라가는 것. 매수 신호.' },
  { num: 75,  term: '데드크로스',      category: '차트·기술 분석', desc: '단기 이동평균선이 장기 이동평균선 아래로 내려가는 것. 매도 신호.' },
  { num: 76,  term: '지지선',          category: '차트·기술 분석', desc: '주가가 더 이상 떨어지지 않게 받쳐주는 가격대.' },
  { num: 77,  term: '저항선',          category: '차트·기술 분석', desc: '주가가 더 이상 오르지 못하게 막는 가격대.' },
  { num: 78,  term: '모멘텀',          category: '차트·기술 분석', desc: '주가가 일정 방향으로 움직이려는 에너지나 동력.' },
  { num: 79,  term: '데드캣 바운스',   category: '차트·기술 분석', desc: '하락장 중에 잠깐 일어나는 기술적 반등. 본격 반등이 아닐 수 있음.' },
  // 시장 상황
  { num: 80,  term: '불마켓 (Bull Market)', category: '시장 상황', desc: '주가가 상승하는 강세장. 황소가 뿔로 올리는 형상에서 유래.' },
  { num: 81,  term: '베어마켓 (Bear Market)', category: '시장 상황', desc: '주가가 하락하는 약세장. 곰이 내리치는 형상에서 유래.' },
  { num: 82,  term: '턴어라운드',      category: '시장 상황', desc: '적자에서 흑자로 전환하는 기업 상태.' },
  { num: 83,  term: '어닝 서프라이즈', category: '시장 상황', desc: '예상보다 실적이 훨씬 잘 나오는 것.' },
  { num: 84,  term: '어닝 쇼크',       category: '시장 상황', desc: '예상보다 실적이 너무 안 나오는 것.' },
  { num: 85,  term: '윈도우 드레싱',   category: '시장 상황', desc: '기관 투자자가 결산기에 실적을 좋아 보이게 주가를 관리하는 것.' },
  { num: 86,  term: '산타 랠리',       category: '시장 상황', desc: '연말 크리스마스를 전후로 주가가 오르는 현상.' },
  { num: 87,  term: '공포지수 (VIX)',  category: '시장 상황', desc: '시장의 불안 심리를 나타내는 지표. 높을수록 시장이 불안정.' },
  // 파생 / 공매도
  { num: 88,  term: '선물',            category: '파생·공매도', desc: '미래의 특정 시점에 미리 정한 가격으로 거래하기로 하는 계약.' },
  { num: 89,  term: '옵션',            category: '파생·공매도', desc: '특정 가격에 사거나 팔 수 있는 \'권리\'를 거래하는 것.' },
  { num: 90,  term: '공매도',          category: '파생·공매도', desc: '주식을 빌려서 팔고 나중에 사서 갚는 방식. 주가 하락 시 수익.' },
  { num: 91,  term: '블록딜',          category: '파생·공매도', desc: '대량의 주식을 시간 외에 한꺼번에 거래하는 방식.' },
  // 시장 안전장치
  { num: 92,  term: '서킷브레이커',    category: '시장 안전장치', desc: '시장 급변 시 주식 매매를 일시 정지시키는 장치.' },
  { num: 93,  term: '사이드카',        category: '시장 안전장치', desc: '선물 시장 급변이 현물 시장에 영향 미치지 않게 제어하는 장치.' },
  { num: 94,  term: 'VI (변동성 완화장치)', category: '시장 안전장치', desc: '특정 종목 주가가 급변 시 2분간 거래 일시 정지.' },
  { num: 95,  term: '반대매매',        category: '시장 안전장치', desc: '빌린 돈을 제때 못 갚을 때 증권사가 강제로 주식을 파는 것.' },
  // 투자자 / 세금 / 계좌
  { num: 96,  term: '서학개미',        category: '투자자·세금·계좌', desc: '미국 등 해외 주식에 투자하는 국내 투자자.' },
  { num: 97,  term: '동학개미',        category: '투자자·세금·계좌', desc: '국내 주식을 적극적으로 사들였던 국내 개인 투자자.' },
  { num: 98,  term: '양도세',          category: '투자자·세금·계좌', desc: '주식을 팔아 남긴 이익에 대해 내는 세금.' },
  { num: 99,  term: '거래세',          category: '투자자·세금·계좌', desc: '주식을 팔 때 무조건 내야 하는 세금.' },
  { num: 100, term: '계좌개설',        category: '투자자·세금·계좌', desc: '주식 거래를 시작하기 위해 통장을 만드는 것.' },
  { num: 101, term: 'HTS',            category: '투자자·세금·계좌', desc: 'Home Trading System. 컴퓨터로 주식을 매매하는 프로그램.' },
  { num: 102, term: 'MTS',            category: '투자자·세금·계좌', desc: 'Mobile Trading System. 스마트폰 앱으로 주식을 매매하는 프로그램.' },
  // 경제 지표 / 기타
  { num: 103, term: '코리아 디스카운트', category: '경제 지표·기타', desc: '한국 기업 가치가 외국에 비해 낮게 평가받는 현상.' },
  { num: 104, term: 'ESG',            category: '경제 지표·기타', desc: '환경(E), 사회(S), 지배구조(G)를 고려하는 지속 가능 경영.' },
  { num: 105, term: '유동성',          category: '경제 지표·기타', desc: '자산을 현금으로 바꿀 수 있는 정도.' },
  { num: 106, term: '낙수효과',        category: '경제 지표·기타', desc: '대기업이 잘되면 중소기업과 서민도 혜택을 본다는 이론.' },
  { num: 107, term: '가계부채',        category: '경제 지표·기타', desc: '개인이 금융기관에서 빌린 모든 빚.' },
  { num: 108, term: '엥겔지수',        category: '경제 지표·기타', desc: '가계 소비 중 식비가 차지하는 비중. 높을수록 생활이 빠듯함.' },
  { num: 109, term: '지니계수',        category: '경제 지표·기타', desc: '소득 불평등 정도를 나타내는 수치 (0~1). 1에 가까울수록 불평등.' },
  { num: 110, term: '기회비용',        category: '경제 지표·기타', desc: '어떤 선택을 함으로써 포기하게 되는 다른 것의 가치.' },
  { num: 111, term: '매몰비용',        category: '경제 지표·기타', desc: '이미 써버려서 다시 회수할 수 없는 비용.' },
  { num: 112, term: '금융문맹',        category: '경제 지표·기타', desc: '경제 지식이 부족해 자산 관리를 못 하는 상태.' },
]

const GLOSSARY_CATEGORIES = ['전체', ...Array.from(new Set(GLOSSARY.map(g => g.category)))]

// ── 연금 가이드 데이터 ────────────────────────────────────────
// (내용은 PensionTab 컴포넌트 내부에 직접 렌더링)

// 차트 보는법 데이터는 ChartTab 컴포넌트 내부에 직접 렌더링

// ── 컴포넌트 ────────────────────────────────────────────────

function GlossaryTab() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')

  const filtered = GLOSSARY.filter(g => {
    const matchCat = category === '전체' || g.category === category
    const matchSearch = g.term.includes(search) || g.desc.includes(search)
    return matchCat && matchSearch
  })

  return (
    <div className="flex flex-col gap-4">
      {/* 검색 + 카테고리 필터 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="용어 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-1.5 flex-wrap">
          {GLOSSARY_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 용어 목록 */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">검색 결과가 없어요</p>
        ) : (
          filtered.map(g => (
            <div key={g.term} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] text-gray-600 font-mono w-6 shrink-0">#{g.num}</span>
                <span className="text-sm font-bold text-white">{g.term}</span>
                <span className="text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded px-1.5 py-0.5">
                  {g.category}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pl-8">{g.desc}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PensionTab() {
  return (
    <div className="flex flex-col gap-8">

      {/* 인트로 */}
      <p className="text-xs text-gray-400 leading-relaxed">노후를 준비하는 연금과 절세 계좌를 쉽게 이해해 봅시다.</p>

      {/* 3층 구조 */}
      <div>
        <SectionTitle emoji="🏗️" title="연금의 3층 구조" />
        <div className="flex flex-col gap-2 mt-3">
          {[
            { layer: '3층', label: '개인연금', sub: 'IRP, 연금저축', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5', badge: '내가 선택해서 추가 가입' },
            { layer: '2층', label: '퇴직연금', sub: 'DB / DC / IRP', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5', badge: '회사에서 의무 가입' },
            { layer: '1층', label: '국민연금', sub: '', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5', badge: '국가가 운영, 의무 납부' },
          ].map(row => (
            <div key={row.layer} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${row.color}`}>
              <span className="text-xs font-bold w-6 shrink-0">{row.layer}</span>
              <span className="text-sm font-bold text-white">{row.label}</span>
              {row.sub && <span className="text-xs text-gray-500">{row.sub}</span>}
              <span className="ml-auto text-[10px] text-gray-400">{row.badge}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">💡 여기에 <strong className="text-gray-300">ISA</strong>를 활용하면 비과세로 목돈을 불린 뒤 IRP로 이전해 연금 재원을 더 키울 수 있습니다.</p>
      </div>

      {/* 1층: 국민연금 */}
      <div>
        <SectionTitle emoji="🏛️" title="1층 · 국민연금" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <InfoCard label="납부 방법" color="amber">
            <p>보험료율: 소득의 <strong className="text-white">9%</strong></p>
            <p>직장인: 본인 4.5% + 회사 4.5%</p>
            <p>자영업자: 9% 전액 본인 부담</p>
          </InfoCard>
          <InfoCard label="받는 시기" color="amber">
            <p>출생 연도에 따라 만 <strong className="text-white">62~65세</strong>부터 수령</p>
            <p>1969년생 이후는 만 65세</p>
          </InfoCard>
          <InfoCard label="중도 인출" color="amber">
            <p>원칙적으로 중도 인출 <strong className="text-white">불가</strong></p>
            <p>예외: 국적 상실·국외 이주, 가입 10년 미만</p>
          </InfoCard>
          <InfoCard label="핵심 포인트" color="amber">
            <p>오래·많이 낼수록 수령액 증가</p>
            <p>국가 보장 → 가장 안전한 연금</p>
          </InfoCard>
        </div>
      </div>

      {/* 2층: 퇴직연금 */}
      <div>
        <SectionTitle emoji="🏢" title="2층 · 퇴직연금" />
        <div className="flex flex-col gap-3 mt-3">
          {/* DB형 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-2">DB형 (확정급여형)</p>
            <ul className="text-xs text-gray-400 leading-relaxed space-y-1">
              <li>• 퇴직 시 받을 금액이 미리 정해져 있음. 운용 책임은 회사.</li>
              <li>• 수령액 = 마지막 3개월 평균 임금 × 근속연수</li>
              <li>• 재직 중 중도 인출 불가 (담보 대출은 가능)</li>
              <li>• <span className="text-white">적합한 경우:</span> 오래 근무하고 임금이 꾸준히 오르는 경우</li>
            </ul>
          </div>
          {/* DC형 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-2">DC형 (확정기여형)</p>
            <ul className="text-xs text-gray-400 leading-relaxed space-y-1">
              <li>• 회사가 매년 임금의 1/12 이상을 내 계좌에 적립</li>
              <li>• 내가 직접 운용 → 결과에 따라 수령액 달라짐</li>
              <li>• 예외 인출: 무주택자 주택 구입, 6개월 이상 요양, 파산·개인회생</li>
              <li>• <span className="text-white">적합한 경우:</span> 투자에 관심 있고 이직이 잦은 경우</li>
            </ul>
          </div>
          {/* IRP */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-2">IRP (개인형 퇴직연금)</p>
            <ul className="text-xs text-gray-400 leading-relaxed space-y-1">
              <li>• 퇴직금을 받는 계좌. 이직마다 유지하며 계속 적립.</li>
              <li>• 직장인뿐 아니라 자영업자·프리랜서도 가입 가능</li>
              <li>• 해지 시 세액공제분 + 운용 수익에 기타소득세 16.5% 부과</li>
              <li>• <span className="text-white">만 55세부터</span> 연금 수령 시 연금소득세 3.3~5.5% 적용</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3층: 개인연금 */}
      <div>
        <SectionTitle emoji="💼" title="3층 · 개인연금" />
        <div className="flex flex-col gap-3 mt-3">
          {/* 연금저축 비교표 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-400 mb-3">연금저축 펀드 vs 보험</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1.5 pr-4 text-gray-500 font-medium">구분</th>
                    <th className="text-left py-1.5 pr-4 text-white font-medium">연금저축펀드</th>
                    <th className="text-left py-1.5 text-white font-medium">연금저축보험</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {[
                    { label: '운용', a: '주식·채권 등 직접 투자', b: '보험사가 운용' },
                    { label: '수익률', a: '시장 따라 변동', b: '낮지만 안정적' },
                    { label: '유연성', a: '높음', b: '낮음' },
                  ].map(row => (
                    <tr key={row.label} className="border-b border-gray-800/50">
                      <td className="py-1.5 pr-4 text-gray-500">{row.label}</td>
                      <td className="py-1.5 pr-4">{row.a}</td>
                      <td className="py-1.5">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">만 55세부터 수령 가능 (가입 후 5년 이상 경과 필요)</p>
          </div>

          {/* ISA */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-400 mb-2">ISA (개인종합자산관리계좌)</p>
            <p className="text-xs text-gray-500 mb-2">연금 계좌는 아니지만, <strong className="text-gray-300">연금 재원을 키우는 전략 계좌</strong>로 활용하면 효과적입니다.</p>
            <ul className="text-xs text-gray-400 leading-relaxed space-y-1 mb-3">
              <li>• 주식·펀드·예금 등 하나의 계좌에서 운용</li>
              <li>• 계좌 내 손익 통산 후 순이익 기준 과세</li>
              <li>• 비과세 한도: 일반형 200만 원 / 서민·농어민형 400만 원</li>
              <li>• 초과분 분리과세 9.9% (일반 15.4%보다 낮음)</li>
            </ul>
            <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-lg p-3">
              <p className="text-xs font-bold text-emerald-400 mb-1">💡 ISA → IRP 이전 전략</p>
              <p className="text-xs text-gray-400 leading-relaxed">ISA 만기 시 IRP·연금저축으로 이전하면 <strong className="text-white">이전 금액의 10%, 최대 300만 원 추가 세액공제</strong> (기본 900만 원 한도와 별도)</p>
              <p className="text-xs text-gray-500 mt-1.5">예: ISA 3,000만 원 만기 → IRP 이전 → 300만 원 추가 공제 → 최대 49.5만 원 환급</p>
            </div>
          </div>
        </div>
      </div>

      {/* 세액공제 */}
      <div>
        <SectionTitle emoji="💰" title="세액공제 혜택 (2026년 기준)" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-400 mb-3">연금저축 + IRP 세액공제 (합산 최대 900만 원)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1.5 pr-4 text-gray-500 font-medium">총급여</th>
                    <th className="text-left py-1.5 pr-4 text-gray-500 font-medium">공제율</th>
                    <th className="text-left py-1.5 text-gray-500 font-medium">최대 환급액</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { income: '5,500만 원 이하', rate: '16.5%', refund: '148만 5천 원' },
                    { income: '5,500만 원 초과', rate: '13.2%', refund: '118만 8천 원' },
                  ].map(row => (
                    <tr key={row.income} className="border-b border-gray-800/50">
                      <td className="py-1.5 pr-4">{row.income}</td>
                      <td className="py-1.5 pr-4 text-white font-medium">{row.rate}</td>
                      <td className="py-1.5 text-emerald-400 font-medium">{row.refund}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">연금저축 600만 원 + IRP 300만 원 = 총 900만 원 한도 활용 가능</p>
          </div>
        </div>
      </div>

      {/* 연금 수령 시 세금 */}
      <div>
        <SectionTitle emoji="📅" title="연금 수령 시 세금" />
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { age: '55~69세', rate: '5.5%', color: 'text-amber-400' },
            { age: '70~79세', rate: '4.4%', color: 'text-emerald-400' },
            { age: '80세 이상', rate: '3.3%', color: 'text-blue-400' },
          ].map(row => (
            <div key={row.age} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{row.age}</p>
              <p className={`text-lg font-bold ${row.color}`}>{row.rate}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">나이가 많을수록 세율이 낮아집니다. 일시금 수령 시 기타소득세 <strong className="text-gray-300">16.5%</strong> 부과.</p>
      </div>

      {/* 활용 전략 요약 */}
      <div>
        <SectionTitle emoji="🎯" title="연금 활용 전략 요약" />
        <div className="flex flex-col gap-2 mt-3">
          {[
            '국민연금 납부 기간을 최대한 늘립니다 (임의가입·추후납부 활용)',
            'ISA에 3년 이상 적립 후 만기 시 IRP로 이전 → 추가 세액공제 300만 원',
            'IRP 또는 연금저축에 연간 900만 원 납입해 기본 세액공제 챙기기',
            'DC형 퇴직연금 가입 중이라면 적극적으로 운용해 수익률 높이기',
            '연금은 만 55세 이후 연금 형태로 수령해야 세금 혜택 가능',
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-emerald-400 shrink-0">{i + 1}</span>
              <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{emoji}</span>
      <h2 className="text-sm font-bold text-white">{title}</h2>
    </div>
  )
}

function InfoCard({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className={`text-xs font-bold mb-1.5 ${colorMap[color] ?? 'text-white'}`}>{label}</p>
      <div className="text-xs text-gray-400 leading-relaxed space-y-0.5">{children}</div>
    </div>
  )
}

function ChartTab() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-xs text-gray-400 leading-relaxed">주식 차트는 주가의 역사를 보여주는 그래프입니다. 패턴을 읽으면 매매 타이밍을 잡는 데 도움이 됩니다.</p>

      {/* 캔들차트 */}
      <div>
        <SectionTitle emoji="🕯️" title="캔들차트 (Candlestick Chart)" />
        <p className="text-xs text-gray-500 mt-1 mb-3">주식 차트에서 가장 많이 쓰이는 기본 형태입니다.</p>

        {/* 캔들 구조 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3 font-mono text-xs text-gray-300 leading-relaxed">
          <pre className="whitespace-pre">{`    │   ← 윗꼬리 (고가까지의 선)
  ┌─┴─┐
  │   │ ← 몸통 (시가~종가 범위)
  └─┬─┘
    │   ← 아랫꼬리 (저가까지의 선)`}</pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 mb-1">양봉 (빨간색)</p>
            <p className="text-xs text-gray-400">종가 &gt; 시가. 그날 주가가 올랐다는 의미.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-1">음봉 (파란색)</p>
            <p className="text-xs text-gray-400">종가 &lt; 시가. 그날 주가가 내렸다는 의미.</p>
          </div>
        </div>

        {/* 캔들 모양 신호 표 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-500 font-medium">캔들 모양</th>
                <th className="text-left p-3 text-gray-500 font-medium">의미</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['몸통이 길고 꼬리가 짧은 양봉', '강한 매수세, 상승 신호'],
                ['몸통이 길고 꼬리가 짧은 음봉', '강한 매도세, 하락 신호'],
                ['아랫꼬리가 긴 캔들', '저점에서 반등 시도, 잠재적 상승 신호'],
                ['윗꼬리가 긴 캔들', '고점에서 매도 압력, 잠재적 하락 신호'],
                ['몸통이 거의 없는 캔들 (십자형)', '매수·매도 균형, 방향 전환 가능성'],
              ].map(([shape, meaning]) => (
                <tr key={shape} className="border-b border-gray-800/60 last:border-0">
                  <td className="p-3 text-gray-300">{shape}</td>
                  <td className="p-3 text-gray-400">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 이동평균선 */}
      <div>
        <SectionTitle emoji="📈" title="이동평균선 (Moving Average)" />
        <p className="text-xs text-gray-500 mt-1 mb-3">선택한 기간 동안의 가격 평균을 이어주는 선. 추세를 명확하게 파악하는 데 사용합니다.</p>

        {/* MA 종류 표 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-500 font-medium">기간</th>
                <th className="text-left p-3 text-gray-500 font-medium">의미</th>
                <th className="text-left p-3 text-gray-500 font-medium">용도</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['5일선', '일주일', '초단기, 데이트레이딩'],
                ['10일선', '2주', '단기 흐름'],
                ['20일선', '한 달', '월간 추세 파악'],
                ['60일선', '3개월', '분기 추세 파악'],
                ['120일선', '6개월', '중장기 흐름'],
                ['240일선', '1년', '장기 추세, 기관 투자자 참고'],
              ].map(([period, meaning, use]) => (
                <tr key={period} className="border-b border-gray-800/60 last:border-0">
                  <td className="p-3 text-amber-400 font-bold">{period}</td>
                  <td className="p-3 text-gray-300">{meaning}</td>
                  <td className="p-3 text-gray-400">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 단기 vs 장기 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-900 border-l-2 border-amber-400 border border-gray-800 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-400 mb-1">📈 단기 이평선</p>
            <p className="text-xs text-gray-400 leading-relaxed">주가 변동에 <strong className="text-white">민감</strong>. 하루 등락에도 크게 흔들림. 단기 추세 파악에 적합.</p>
          </div>
          <div className="bg-gray-900 border-l-2 border-indigo-400 border border-gray-800 rounded-xl p-3">
            <p className="text-xs font-bold text-indigo-400 mb-1">📊 장기 이평선</p>
            <p className="text-xs text-gray-400 leading-relaxed">주가 변동에 <strong className="text-white">둔감</strong>. 하루 등락에 큰 변화 없음. 장기 추세 파악에 적합.</p>
          </div>
        </div>

        {/* 이평선 시나리오 4종 */}
        <p className="text-xs text-gray-500 mb-2">이평선을 기준으로 캔들의 위치에 따라 매매 신호가 달라집니다.</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* 시나리오 1: 이평선 아래 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-red-500/10">
              <span className="text-xs font-bold text-gray-300">캔들이 이평선 아래</span>
              <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-2 py-0.5">매도</span>
            </div>
            <div className="p-2 bg-gray-950">
              <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M 0,20 Q 100,13 200,20" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                {[17,45,73,101,129,157,185].map((x, i) => (
                  <g key={x}>
                    <line x1={x} y1={30+i%3*2} x2={x} y2={36+i%3*2} stroke="#6b7280" strokeWidth="1.5"/>
                    <rect x={x-6} y={36+i%3*2} width="12" height={16+i%2*4} fill="#6b7280" rx="1"/>
                    <line x1={x} y1={52+i%3*2+i%2*4} x2={x} y2={60+i%3*2+i%2*4} stroke="#6b7280" strokeWidth="1.5"/>
                  </g>
                ))}
              </svg>
            </div>
            <div className="px-3 py-2 text-[10px] text-gray-400 leading-relaxed border-t border-gray-800">현재 가격 &lt; 평균 단가<br/><strong className="text-red-400">매도 압력 지속 가능성 ↑</strong></div>
          </div>

          {/* 시나리오 2: 위쪽 이평선 터치 (저항) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-red-500/10">
              <span className="text-xs font-bold text-gray-300">이평선 터치 (저항)</span>
              <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-2 py-0.5">매도</span>
            </div>
            <div className="p-2 bg-gray-950">
              <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M 0,58 Q 100,10 200,58" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                {[[17,48,16],[45,34,18],[73,20,16],[101,11,14],[129,20,16],[157,36,18],[185,50,16]].map(([x,y,h]) => (
                  <g key={x}>
                    <line x1={x} y1={y-6} x2={x} y2={y} stroke="#6b7280" strokeWidth="1.5"/>
                    <rect x={x-6} y={y} width="12" height={h} fill="#6b7280" rx="1"/>
                    <line x1={x} y1={y+h} x2={x} y2={y+h+6} stroke="#6b7280" strokeWidth="1.5"/>
                  </g>
                ))}
              </svg>
            </div>
            <div className="px-3 py-2 text-[10px] text-gray-400 leading-relaxed border-t border-gray-800">평균 단가 근처 → 본절 심리<br/><strong className="text-red-400">가격 하락(저항) 가능성 ↑</strong></div>
          </div>

          {/* 시나리오 3: 이평선 위 (중립) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-700/30">
              <span className="text-xs font-bold text-gray-300">캔들이 이평선 위</span>
              <span className="text-[10px] font-bold bg-gray-500 text-white rounded-full px-2 py-0.5">중립</span>
            </div>
            <div className="p-2 bg-gray-950">
              <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M 0,64 Q 100,58 200,62" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                {[[17,28,18],[45,18,22],[73,12,20],[101,10,24],[129,16,20],[157,24,18],[185,30,16]].map(([x,y,h]) => (
                  <g key={x}>
                    <line x1={x} y1={y-6} x2={x} y2={y} stroke="#6b7280" strokeWidth="1.5"/>
                    <rect x={x-6} y={y} width="12" height={h} fill="#6b7280" rx="1"/>
                    <line x1={x} y1={y+h} x2={x} y2={y+h+6} stroke="#6b7280" strokeWidth="1.5"/>
                  </g>
                ))}
              </svg>
            </div>
            <div className="px-3 py-2 text-[10px] text-gray-400 leading-relaxed border-t border-gray-800">현재 가격 &gt; 평균 단가<br/><strong className="text-gray-300">추세 지속 시 홀딩 유지</strong></div>
          </div>

          {/* 시나리오 4: 아래쪽 이평선 터치 (지지) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-green-500/10">
              <span className="text-xs font-bold text-gray-300">이평선 터치 (지지)</span>
              <span className="text-[10px] font-bold bg-green-500 text-white rounded-full px-2 py-0.5">매수</span>
            </div>
            <div className="p-2 bg-gray-950">
              <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M 0,20 Q 100,66 200,20" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                {[[17,10,16],[45,22,18],[73,36,16],[101,46,14],[129,36,16],[157,22,18],[185,10,16]].map(([x,y,h]) => (
                  <g key={x}>
                    <line x1={x} y1={y-6} x2={x} y2={y} stroke="#6b7280" strokeWidth="1.5"/>
                    <rect x={x-6} y={y} width="12" height={h} fill="#6b7280" rx="1"/>
                    <line x1={x} y1={y+h} x2={x} y2={y+h+6} stroke="#6b7280" strokeWidth="1.5"/>
                  </g>
                ))}
              </svg>
            </div>
            <div className="px-3 py-2 text-[10px] text-gray-400 leading-relaxed border-t border-gray-800">평균 단가 근처 하락 → 손실 회피 추매<br/><strong className="text-green-400">가격 반등(지지) 가능성 ↑</strong></div>
          </div>
        </div>

        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-xs text-gray-400 leading-relaxed mb-3">
          📌 <strong className="text-amber-400">이평선 활용 핵심:</strong> 지지 시 매수, 저항 시 매도. 지지와 저항의 원리를 이용하는 것이 이평선 매매의 핵심입니다.
        </div>

        {/* 골든/데드크로스 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-green-400 mb-1">🟢 골든크로스 — 매수 신호</p>
            <p className="text-xs text-gray-400 leading-relaxed">단기 이평선이 장기 이평선을 <strong className="text-white">아래에서 위로</strong> 교차할 때. 예: 5일선이 20일선을 뚫고 올라가는 순간.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 mb-1">🔴 데드크로스 — 매도 신호</p>
            <p className="text-xs text-gray-400 leading-relaxed">단기 이평선이 장기 이평선을 <strong className="text-white">위에서 아래로</strong> 교차할 때. 이평선 방향: 우상향=상승추세 / 우하향=하락추세.</p>
          </div>
        </div>
      </div>

      {/* 거래량 */}
      <div>
        <SectionTitle emoji="📊" title="거래량 (Volume)" />
        <p className="text-xs text-gray-500 mt-1 mb-3">주가 변화는 거래량과 함께 봐야 신뢰도가 높아집니다.</p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-500 font-medium">상황</th>
                <th className="text-left p-3 text-gray-500 font-medium">의미</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['주가 상승 + 거래량 증가', '강한 매수세, 신뢰도 높은 상승', 'text-green-400'],
                ['주가 상승 + 거래량 감소', '상승 동력 약화, 주의 필요', 'text-amber-400'],
                ['주가 하락 + 거래량 증가', '강한 매도세, 추가 하락 가능성', 'text-red-400'],
                ['주가 하락 + 거래량 감소', '하락 동력 약화, 반등 가능성', 'text-blue-400'],
              ].map(([situation, meaning, color]) => (
                <tr key={situation} className="border-b border-gray-800/60 last:border-0">
                  <td className="p-3 text-gray-300">{situation}</td>
                  <td className={`p-3 font-medium ${color}`}>{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">거래량이 평소의 2~3배 이상 급증하면 큰 세력이 움직인다는 신호일 수 있습니다.</p>
      </div>

      {/* 지지선과 저항선 */}
      <div>
        <SectionTitle emoji="📏" title="지지선과 저항선" />
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-3 mb-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-red-400"></div>
              <span className="text-[10px] text-red-400 shrink-0">저항선 (자주 막힘)</span>
            </div>
            <div className="text-center text-sm text-gray-500 tracking-widest">↗↘↗↘↗↘↗</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-green-400"></div>
              <span className="text-[10px] text-green-400 shrink-0">지지선 (자주 반등)</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-green-400 mb-1">지지선 (Support)</p>
            <p className="text-xs text-gray-400 leading-relaxed">주가가 내려가다 반등하는 가격대. 매수세가 모이는 구간. 지지선을 깨고 내려가면 추가 하락 가능성 ↑</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 mb-1">저항선 (Resistance)</p>
            <p className="text-xs text-gray-400 leading-relaxed">주가가 올라가다 막히는 가격대. 매도세가 집중되는 구간. 저항선을 돌파하면 강한 상승 신호.</p>
          </div>
        </div>
      </div>

      {/* 보조지표 */}
      <div>
        <SectionTitle emoji="🔧" title="보조 지표" />
        <div className="flex flex-col gap-2 mt-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-400 mb-2">RSI (상대강도지수)</p>
            <p className="text-xs text-gray-400 mb-2">0~100 사이 값으로 과매수/과매도를 나타냅니다.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-center">
                <p className="text-xs font-bold text-red-400">70 이상</p>
                <p className="text-[10px] text-gray-400 mt-0.5">과매수 → 하락 가능성</p>
              </div>
              <div className="flex-1 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 text-center">
                <p className="text-xs font-bold text-green-400">30 이하</p>
                <p className="text-[10px] text-gray-400 mt-0.5">과매도 → 반등 가능성</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-400 mb-1">MACD</p>
            <p className="text-xs text-gray-400 leading-relaxed">두 이동평균선 차이를 이용한 추세 지표.<br/>• MACD선이 시그널선을 <span className="text-green-400">위로 교차</span> → 매수 신호<br/>• MACD선이 시그널선을 <span className="text-red-400">아래로 교차</span> → 매도 신호</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-400 mb-1">볼린저 밴드 (Bollinger Bands)</p>
            <p className="text-xs text-gray-400 leading-relaxed">이동평균선 위아래로 표준편차 범위를 표시한 밴드.<br/>• 상단 밴드 근처 → 과매수 가능성<br/>• 하단 밴드 근처 → 과매도 가능성<br/>• 밴드 폭이 좁아지면 큰 변동 임박 신호</p>
          </div>
        </div>
      </div>

      {/* 매수/매도 패턴 */}
      <div>
        <SectionTitle emoji="🎯" title="매수 / 매도 패턴 조합 신호" />
        <p className="text-xs text-gray-500 mt-1 mb-4">캔들 패턴 + 확인 신호가 함께 나타날 때 신뢰도가 높아집니다.</p>

        <div className="grid grid-cols-2 gap-3">
          {/* 매수 패턴 */}
          <div>
            <div className="text-center text-sm font-black py-2 px-3 rounded-xl mb-2 text-white bg-gradient-to-br from-green-500 to-green-700">사세요 📈</div>

            {/* 1. 샛별 + 핀버 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 58 58" width="46" height="46"><line x1="9" y1="3" x2="9" y2="9" stroke="#ef4444" strokeWidth="2"/><rect x="3" y="9" width="12" height="34" fill="#ef4444" rx="1"/><line x1="9" y1="43" x2="9" y2="50" stroke="#ef4444" strokeWidth="2"/><rect x="22" y="42" width="10" height="8" fill="#ef4444" rx="1"/><line x1="27" y1="38" x2="27" y2="42" stroke="#ef4444" strokeWidth="1.5"/><line x1="27" y1="50" x2="27" y2="55" stroke="#ef4444" strokeWidth="1.5"/><line x1="49" y1="3" x2="49" y2="10" stroke="#22c55e" strokeWidth="2"/><rect x="43" y="10" width="12" height="36" fill="#22c55e" rx="1"/><line x1="49" y1="46" x2="49" y2="53" stroke="#22c55e" strokeWidth="2"/></svg>
                  <span className="text-[7px] text-gray-500">샛별</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><rect x="4" y="18" width="12" height="12" fill="#22c55e" rx="1"/><line x1="10" y1="30" x2="10" y2="54" stroke="#22c55e" strokeWidth="2.5"/></svg>
                  <span className="text-[7px] text-gray-500">-핀버</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★★★</span>
                </div>
              </div>
            </div>

            {/* 2. 음의 양포형 + 포선 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 40 58" width="32" height="46"><rect x="3" y="22" width="12" height="16" fill="#ef4444" rx="1"/><line x1="9" y1="18" x2="9" y2="22" stroke="#ef4444" strokeWidth="1.5"/><line x1="9" y1="38" x2="9" y2="43" stroke="#ef4444" strokeWidth="1.5"/><rect x="25" y="10" width="12" height="38" fill="#22c55e" rx="1"/><line x1="31" y1="6" x2="31" y2="10" stroke="#22c55e" strokeWidth="1.5"/><line x1="31" y1="48" x2="31" y2="53" stroke="#22c55e" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">음의 양포형</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="5" x2="10" y2="14" stroke="#22c55e" strokeWidth="1.5"/><rect x="4" y="14" width="12" height="18" fill="#22c55e" rx="1"/><line x1="10" y1="32" x2="10" y2="52" stroke="#22c55e" strokeWidth="2.5"/></svg>
                  <span className="text-[7px] text-gray-500">포선</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★★☆</span>
                </div>
              </div>
            </div>

            {/* 3. 스파이크로 + 핀버 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 60 58" width="46" height="46"><polyline points="3,10 14,20 22,32 28,46 30,55 32,46 38,32 46,20 57,10" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="30" cy="55" r="3" fill="#22c55e"/></svg>
                  <span className="text-[7px] text-gray-500">스파이크로</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><rect x="4" y="18" width="12" height="12" fill="#22c55e" rx="1"/><line x1="10" y1="30" x2="10" y2="54" stroke="#22c55e" strokeWidth="2.5"/></svg>
                  <span className="text-[7px] text-gray-500">-핀버</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★☆☆</span>
                </div>
              </div>
            </div>

            {/* 4. 더블 바텀 + 음선→대양선 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 72 58" width="52" height="46"><polyline points="3,10 17,50 35,24 53,50 69,8" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="50" r="3" fill="#22c55e"/><circle cx="53" cy="50" r="3" fill="#22c55e"/></svg>
                  <span className="text-[7px] text-gray-500">더블 바텀</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 38 58" width="28" height="46"><rect x="3" y="22" width="12" height="24" fill="#ef4444" rx="1"/><line x1="9" y1="18" x2="9" y2="22" stroke="#ef4444" strokeWidth="1.5"/><line x1="9" y1="46" x2="9" y2="52" stroke="#ef4444" strokeWidth="1.5"/><rect x="23" y="6" width="12" height="44" fill="#22c55e" rx="1"/><line x1="29" y1="3" x2="29" y2="6" stroke="#22c55e" strokeWidth="1.5"/><line x1="29" y1="50" x2="29" y2="55" stroke="#22c55e" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">음선→대양선</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★★★</span>
                </div>
              </div>
            </div>

            {/* 5. 역삼존 + 샛별 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 82 58" width="56" height="46"><polyline points="3,14 13,36 24,26 41,55 58,26 69,36 79,14" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="14" x2="79" y2="14" stroke="#22c55e" strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/></svg>
                  <span className="text-[7px] text-gray-500">역삼존</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 44 58" width="32" height="46"><rect x="2" y="14" width="11" height="26" fill="#ef4444" rx="1"/><rect x="17" y="32" width="9" height="7" fill="#ef4444" rx="1"/><line x1="21" y1="28" x2="21" y2="32" stroke="#ef4444" strokeWidth="1.5"/><rect x="30" y="10" width="11" height="30" fill="#22c55e" rx="1"/><line x1="35" y1="6" x2="35" y2="10" stroke="#22c55e" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">샛별</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★★☆</span>
                </div>
              </div>
            </div>

            {/* 6. 소서바텀 + 제비돌려줘 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 72 58" width="52" height="46"><path d="M3,10 Q36,58 69,10" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  <span className="text-[7px] text-gray-500">소서바텀</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="4" x2="10" y2="16" stroke="#22c55e" strokeWidth="1.5"/><rect x="4" y="16" width="12" height="10" fill="#22c55e" rx="1"/><line x1="10" y1="26" x2="10" y2="54" stroke="#22c55e" strokeWidth="2.5"/></svg>
                  <span className="text-[7px] text-gray-500">제비돌려줘</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★☆☆</span>
                </div>
              </div>
            </div>

            {/* 7. 삼각법 + 햇빛진달래선 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 72 58" width="52" height="46"><line x1="3" y1="10" x2="70" y2="10" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.5"/><polyline points="3,52 14,32 27,45 40,22 53,36 66,10" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-[7px] text-gray-500">삼각법</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="3" x2="10" y2="8" stroke="#22c55e" strokeWidth="1.5"/><rect x="4" y="8" width="12" height="48" fill="#22c55e" rx="1"/></svg>
                  <span className="text-[7px] text-gray-500">햇빛진달래</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★☆☆</span>
                </div>
              </div>
            </div>

            {/* 8. 도쿄시간 + 적삼병 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 44 58" width="34" height="46"><circle cx="22" cy="27" r="20" fill="none" stroke="#6366f1" strokeWidth="2"/><circle cx="22" cy="27" r="2" fill="#6366f1"/><line x1="22" y1="27" x2="7" y2="27" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/><line x1="22" y1="27" x2="22" y2="9" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/><text x="22" y="55" textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="bold">도쿄</text></svg>
                  <span className="text-[7px] text-gray-500">도쿄 시간</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 56 58" width="42" height="46"><rect x="2" y="32" width="12" height="22" fill="#22c55e" rx="1"/><line x1="8" y1="28" x2="8" y2="32" stroke="#22c55e" strokeWidth="1.5"/><rect x="22" y="18" width="12" height="26" fill="#22c55e" rx="1"/><line x1="28" y1="14" x2="28" y2="18" stroke="#22c55e" strokeWidth="1.5"/><line x1="28" y1="44" x2="28" y2="49" stroke="#22c55e" strokeWidth="1.5"/><rect x="42" y="5" width="12" height="28" fill="#22c55e" rx="1"/><line x1="48" y1="3" x2="48" y2="5" stroke="#22c55e" strokeWidth="1.5"/><line x1="48" y1="33" x2="48" y2="38" stroke="#22c55e" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">적삼병</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-green-500 text-white rounded-full px-1.5 py-0.5">매수</span>
                  <span className="text-[8px] text-green-400">★★★★★</span>
                </div>
              </div>
            </div>
          </div>

          {/* 매도 패턴 */}
          <div>
            <div className="text-center text-sm font-black py-2 px-3 rounded-xl mb-2 text-white bg-gradient-to-br from-red-500 to-red-700">팔아요 📉</div>

            {/* 1. 별 + 흑삼병 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 58 58" width="46" height="46"><line x1="9" y1="3" x2="9" y2="9" stroke="#22c55e" strokeWidth="2"/><rect x="3" y="9" width="12" height="34" fill="#22c55e" rx="1"/><line x1="9" y1="43" x2="9" y2="49" stroke="#22c55e" strokeWidth="2"/><rect x="22" y="4" width="10" height="8" fill="#22c55e" rx="1"/><line x1="27" y1="3" x2="27" y2="4" stroke="#22c55e" strokeWidth="1.5"/><line x1="27" y1="12" x2="27" y2="17" stroke="#22c55e" strokeWidth="1.5"/><line x1="49" y1="5" x2="49" y2="12" stroke="#ef4444" strokeWidth="2"/><rect x="43" y="12" width="12" height="34" fill="#ef4444" rx="1"/><line x1="49" y1="46" x2="49" y2="53" stroke="#ef4444" strokeWidth="2"/></svg>
                  <span className="text-[7px] text-gray-500">별</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 56 58" width="42" height="46"><rect x="2" y="8" width="12" height="28" fill="#ef4444" rx="1"/><line x1="8" y1="4" x2="8" y2="8" stroke="#ef4444" strokeWidth="1.5"/><line x1="8" y1="36" x2="8" y2="42" stroke="#ef4444" strokeWidth="1.5"/><rect x="22" y="16" width="12" height="30" fill="#ef4444" rx="1"/><line x1="28" y1="12" x2="28" y2="16" stroke="#ef4444" strokeWidth="1.5"/><line x1="28" y1="46" x2="28" y2="52" stroke="#ef4444" strokeWidth="1.5"/><rect x="42" y="26" width="12" height="30" fill="#ef4444" rx="1"/><line x1="48" y1="22" x2="48" y2="26" stroke="#ef4444" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">흑삼병</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★★★</span>
                </div>
              </div>
            </div>

            {/* 2. 별똥별 + -핀버 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="3" x2="10" y2="32" stroke="#ef4444" strokeWidth="2"/><rect x="4" y="32" width="12" height="12" fill="#ef4444" rx="1"/><line x1="10" y1="44" x2="10" y2="50" stroke="#ef4444" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">별똥별</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="3" x2="10" y2="18" stroke="#ef4444" strokeWidth="2"/><rect x="4" y="18" width="12" height="12" fill="#ef4444" rx="1"/></svg>
                  <span className="text-[7px] text-gray-500">-핀버</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★★☆</span>
                </div>
              </div>
            </div>

            {/* 3. 돌부스러기 + 그늘3개 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 55 58" width="42" height="46"><rect x="2" y="14" width="11" height="10" fill="#ef4444" rx="1"/><rect x="16" y="22" width="11" height="10" fill="#ef4444" rx="1"/><rect x="30" y="30" width="11" height="10" fill="#ef4444" rx="1"/><rect x="44" y="38" width="11" height="10" fill="#ef4444" rx="1"/></svg>
                  <span className="text-[7px] text-gray-500">돌부스러기</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 55 58" width="42" height="46"><line x1="9" y1="3" x2="9" y2="14" stroke="#ef4444" strokeWidth="1.5"/><rect x="3" y="14" width="12" height="24" fill="#ef4444" rx="1"/><line x1="29" y1="3" x2="29" y2="14" stroke="#ef4444" strokeWidth="1.5"/><rect x="23" y="14" width="12" height="28" fill="#ef4444" rx="1"/><line x1="49" y1="3" x2="49" y2="14" stroke="#ef4444" strokeWidth="1.5"/><rect x="43" y="14" width="12" height="32" fill="#ef4444" rx="1"/></svg>
                  <span className="text-[7px] text-gray-500">그늘 3개</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★☆☆</span>
                </div>
              </div>
            </div>

            {/* 4. 삼존 + 3법 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 82 58" width="56" height="46"><polyline points="3,48 13,30 24,40 41,5 58,40 69,30 79,48" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="48" x2="79" y2="48" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/></svg>
                  <span className="text-[7px] text-gray-500">삼존</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 44 58" width="32" height="46"><rect x="2" y="6" width="12" height="46" fill="#ef4444" rx="1"/><line x1="8" y1="3" x2="8" y2="6" stroke="#ef4444" strokeWidth="1.5"/><rect x="18" y="22" width="8" height="8" fill="#22c55e" rx="1"/><rect x="27" y="18" width="8" height="8" fill="#22c55e" rx="1"/><rect x="34" y="8" width="10" height="44" fill="#ef4444" rx="1"/></svg>
                  <span className="text-[7px] text-gray-500">3법</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★★★</span>
                </div>
              </div>
            </div>

            {/* 5. 하강 렉탱글 + 슬러스트다운 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 72 58" width="52" height="46"><polyline points="3,8 13,16 20,24 28,22 36,32 44,30 52,40 60,38" fill="none" stroke="#ef4444" strokeWidth="2"/><rect x="18" y="20" width="44" height="22" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.5"/><line x1="60" y1="38" x2="60" y2="56" stroke="#ef4444" strokeWidth="3"/></svg>
                  <span className="text-[7px] text-gray-500">하강 렉탱글</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="3" x2="10" y2="8" stroke="#ef4444" strokeWidth="1.5"/><rect x="4" y="8" width="12" height="48" fill="#ef4444" rx="1"/></svg>
                  <span className="text-[7px] text-gray-500">슬러스트다운</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★☆☆</span>
                </div>
              </div>
            </div>

            {/* 6. 하강 플래그 + 햇빛두동강 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 72 58" width="52" height="46"><line x1="5" y1="3" x2="5" y2="32" stroke="#ef4444" strokeWidth="3"/><polyline points="5,32 18,38 30,34 44,40 58,36 69,42" fill="none" stroke="#ef4444" strokeWidth="1.5"/><polyline points="5,32 18,26 30,22 44,28 58,24 69,30" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2"/></svg>
                  <span className="text-[7px] text-gray-500">하강 플래그</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="3" x2="10" y2="8" stroke="#22c55e" strokeWidth="1.5"/><rect x="4" y="8" width="12" height="18" fill="#22c55e" rx="1"/><rect x="4" y="26" width="12" height="28" fill="#ef4444" rx="1"/><line x1="10" y1="54" x2="10" y2="57" stroke="#ef4444" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">햇빛두동강</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★★☆</span>
                </div>
              </div>
            </div>

            {/* 7. 하강 페넌트 + 다시돌려줘 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 72 58" width="52" height="46"><line x1="5" y1="3" x2="5" y2="30" stroke="#ef4444" strokeWidth="3"/><polyline points="5,30 20,36 36,32 52,37 67,34" fill="none" stroke="#ef4444" strokeWidth="1.5"/><polyline points="5,30 20,24 36,26 52,29 67,34" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2"/></svg>
                  <span className="text-[7px] text-gray-500">하강 페넌트</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="3" x2="10" y2="10" stroke="#22c55e" strokeWidth="1.5"/><rect x="4" y="10" width="12" height="14" fill="#22c55e" rx="1"/><rect x="4" y="24" width="12" height="30" fill="#ef4444" rx="1"/><line x1="10" y1="54" x2="10" y2="57" stroke="#ef4444" strokeWidth="1.5"/></svg>
                  <span className="text-[7px] text-gray-500">다시돌려줘</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★☆☆</span>
                </div>
              </div>
            </div>

            {/* 8. 런던시간 + -핀버 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 mb-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 44 58" width="34" height="46"><circle cx="22" cy="27" r="20" fill="none" stroke="#7c3aed" strokeWidth="2"/><circle cx="22" cy="27" r="2" fill="#7c3aed"/><line x1="22" y1="27" x2="11" y2="41" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/><line x1="22" y1="27" x2="22" y2="9" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/><text x="22" y="55" textAnchor="middle" fontSize="9" fill="#7c3aed" fontWeight="bold">런던</text></svg>
                  <span className="text-[7px] text-gray-500">런던 시간</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">+</span>
                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 20 58" width="16" height="46"><line x1="10" y1="3" x2="10" y2="18" stroke="#ef4444" strokeWidth="2"/><rect x="4" y="18" width="12" height="12" fill="#ef4444" rx="1"/></svg>
                  <span className="text-[7px] text-gray-500">-핀버</span>
                </div>
                <span className="text-[10px] text-gray-600 font-bold">=</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">매도</span>
                  <span className="text-[8px] text-red-400">★★★★☆</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 패턴 설명 */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="border-l-2 border-green-500 pl-3">
            <p className="text-xs font-bold text-green-400 mb-1.5">📈 매수 패턴 설명</p>
            <ul className="text-xs text-gray-400 space-y-1 leading-relaxed">
              <li>• <strong className="text-white">샛별</strong>: 음봉 2개 + 작은 캔들 후 큰 양봉. 하락 끝 강한 반등 신호.</li>
              <li>• <strong className="text-white">음의 양포형</strong>: 큰 양봉이 앞 음봉을 완전히 감싸는 형태. 매수세 역전 신호.</li>
              <li>• <strong className="text-white">스파이크로</strong>: 급락 후 V자 반등. 강한 하방 지지 확인.</li>
              <li>• <strong className="text-white">더블 바텀 (W형)</strong>: 같은 저점을 두 번 찍고 반등. 신뢰도 높은 반전 패턴.</li>
              <li>• <strong className="text-white">역삼존</strong>: 세 저점 중 가운데가 가장 낮은 형태. 강한 상승 전환 신호.</li>
              <li>• <strong className="text-white">소서바텀</strong>: U자 바닥을 다지며 상승. 완만하지만 안정적인 반전.</li>
              <li>• <strong className="text-white">삼각법</strong>: 고점·저점이 수렴하다 위로 돌파. 큰 상승 가능.</li>
              <li>• <strong className="text-white">적삼병</strong>: 큰 양봉 3개 연속. 강한 매수세 신호.</li>
            </ul>
          </div>
          <div className="border-l-2 border-red-500 pl-3">
            <p className="text-xs font-bold text-red-400 mb-1.5">📉 매도 패턴 설명</p>
            <ul className="text-xs text-gray-400 space-y-1 leading-relaxed">
              <li>• <strong className="text-white">별 + 흑삼병</strong>: 상승 끝 음봉 3연속. 가장 강한 하락 반전 신호.</li>
              <li>• <strong className="text-white">별똥별</strong>: 윗꼬리가 긴 캔들. 고점에서 매도세가 강하게 유입된 증거.</li>
              <li>• <strong className="text-white">돌부스러기 + 그늘 3개</strong>: 연속 음봉 + 고점 그늘. 매수세 소진 신호.</li>
              <li>• <strong className="text-white">삼존 (헤드앤숄더)</strong>: 가운데 고점이 가장 높은 형태. 신뢰도 높은 하락 전환.</li>
              <li>• <strong className="text-white">하강 렉탱글</strong>: 하락 후 박스권 횡보 → 하방 돌파. 추가 하락 신호.</li>
              <li>• <strong className="text-white">하강 플래그</strong>: 급락 후 반등처럼 보이는 채널. 이탈 시 다시 급락.</li>
              <li>• <strong className="text-white">하강 페넌트</strong>: 하락 후 수렴하다 아래로 돌파. 하락 추세 지속.</li>
            </ul>
          </div>
        </div>

        {/* 신뢰도 기준 */}
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <p className="text-xs font-bold text-gray-300 px-4 py-2 border-b border-gray-800">📌 신뢰도 기준</p>
          {[
            ['★★★★★', '매우 강한 신호. 단독으로도 참고 가능'],
            ['★★★★☆', '강한 신호. 거래량·보조지표 함께 확인 권장'],
            ['★★★☆☆', '보조 신호. 다른 지표와 반드시 함께 봐야 함'],
          ].map(([stars, meaning]) => (
            <div key={stars} className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/60 last:border-0">
              <span className="text-xs text-amber-400 font-mono shrink-0">{stars}</span>
              <span className="text-xs text-gray-400">{meaning}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-xs text-gray-400 leading-relaxed">
          ⚠️ 패턴은 참고 도구입니다. 단독 패턴보다 <strong className="text-amber-400">패턴 + 거래량 + 이동평균선</strong>을 함께 확인할 때 신뢰도가 올라갑니다.
        </div>
      </div>

      {/* 주의할 점 */}
      <div>
        <SectionTitle emoji="⚠️" title="차트 분석 시 주의할 점" />
        <div className="flex flex-col gap-2 mt-3">
          {[
            '과거 패턴이 반드시 반복되지는 않습니다. 차트는 참고 도구입니다.',
            '여러 지표를 함께 봅니다. 하나의 지표만으로 판단하면 오류가 생깁니다.',
            '기업의 실적·뉴스와 함께 봅니다. 차트만으로 투자 결정을 내리는 것은 위험합니다.',
            '장기 차트와 단기 차트를 모두 확인합니다. 큰 그림을 먼저 보고 세부 타이밍을 잡습니다.',
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-amber-400 shrink-0">{i + 1}</span>
              <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<TabId>('glossary')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">💡</span>
          <div>
            <h1 className="text-lg font-bold text-white">지식인</h1>
            <p className="text-xs text-gray-500">주식·연금·차트 기초 지식 모음</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1.5 mb-6 bg-gray-900 p-1 rounded-xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'glossary' && <GlossaryTab />}
        {activeTab === 'pension'  && <PensionTab />}
        {activeTab === 'chart'    && <ChartTab />}
      </div>
    </div>
  )
}
