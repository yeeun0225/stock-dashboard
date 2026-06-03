'use client'

import { useState } from 'react'

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

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <GlossaryTab />
      </div>
    </div>
  )
}
