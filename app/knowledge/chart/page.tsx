'use client'

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{emoji}</span>
      <h2 className="text-sm font-bold text-white">{title}</h2>
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

export default function ChartPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <ChartTab />
      </div>
    </div>
  )
}
