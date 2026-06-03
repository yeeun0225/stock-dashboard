'use client'

import type { ReactNode } from 'react'

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{emoji}</span>
      <h2 className="text-sm font-bold text-white">{title}</h2>
    </div>
  )
}

function InfoCard({ label, color, children }: { label: string; color: string; children: ReactNode }) {
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

export default function PensionPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🏦</span>
          <div>
            <h1 className="text-lg font-bold text-white">연금 가이드</h1>
            <p className="text-xs text-gray-500">노후를 준비하는 연금과 절세 계좌</p>
          </div>
        </div>
        <PensionTab />
      </div>
    </div>
  )
}
