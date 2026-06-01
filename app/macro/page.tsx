'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { MacroAPIData, MacroIndicator } from '@/app/api/macro/route'
import type { PlumbingPanel } from '@/app/api/plumbing/route'
import type { CapitalRatioData, RatioCard } from '@/app/api/capital-ratio/route'
import type { SectorRotationData } from '@/app/api/sector-rotation/route'
import type { LeverageSentimentData } from '@/app/api/leverage-sentiment/route'
import RefreshBadge from '@/components/RefreshBadge'

// ═══════════════════════════════════════════════════════════
// ── 정보 팝업 ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
interface InfoItem { label: string; text: string }

function InfoPopup({ title, summary, items }: {
  title: string
  summary: string
  items: InfoItem[]
}) {
  const [open, setOpen]       = useState(false)
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const popup = (
    <>
      {/* 백드롭 — 클릭하면 닫힘 */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        className="bg-black/50"
        onClick={() => setOpen(false)}
      />
      {/* 팝업 — 화면 정중앙 고정 */}
      <div
        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}
        className="w-80 max-w-[calc(100vw-32px)] max-h-[75vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* 헤더 — 고정 */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-gray-800 shrink-0">
          <p className="text-sm font-bold text-white leading-snug">{title}</p>
          <button
            onClick={() => setOpen(false)}
            className="shrink-0 text-gray-500 hover:text-white text-xl leading-none mt-0.5"
          >×</button>
        </div>
        {/* 내용 — 스크롤 */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-3">
          <p className="text-xs text-gray-400 leading-relaxed">{summary}</p>
          <div className="flex flex-col gap-3 border-t border-gray-800 pt-3">
            {items.map(it => (
              <div key={it.label}>
                <p className="text-xs font-semibold text-blue-400 mb-0.5">{it.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-xs font-bold flex items-center justify-center transition-colors shrink-0"
        aria-label="설명 보기"
      >
        ?
      </button>
      {mounted && open && createPortal(popup, document.body)}
    </>
  )
}

// ── 팝업 컨텐츠 정의 ──────────────────────────────────────
const INFO = {
  vixMove: {
    title: '변동성 지표를 왜 봐야 할까?',
    summary: '시장 참여자들의 "공포 수준"을 숫자로 나타낸 지표예요. 수치가 높을수록 투자자들이 불안해하고 있다는 신호로, 주가 급락 전 경고등 역할을 합니다.',
    items: [
      { label: 'VIX — 주식시장 공포 지수', text: 'S&P 500 옵션 가격에서 계산한 향후 30일 예상 변동성이에요. 20 이하면 시장이 차분하고, 30을 넘으면 투자자들이 패닉 상태에 가깝다는 뜻입니다. 2008년 금융위기엔 80까지 치솟았어요.' },
      { label: 'MOVE — 채권시장 공포 지수', text: '미국 국채 옵션에서 뽑은 금리 변동성 지수예요. 금리가 불안정하면 기업·정부 대출 비용이 흔들리고, 주식·부동산 가치 계산 자체가 불확실해집니다. VIX와 함께 오르면 전방위 위기 신호예요.' },
    ],
  },
  panel1: {
    title: '중앙은행 유동성을 왜 봐야 할까?',
    summary: 'Fed(미국 중앙은행)가 시장에 돈을 얼마나 공급하는지 직접 보여줘요. 쉽게 말해 "금융 수도꼭지가 얼마나 열려 있냐"를 체크하는 겁니다.',
    items: [
      { label: 'Fed 자산 규모 (WALCL)', text: 'Fed가 보유한 국채·MBS 총액이에요. 이게 늘면(QE) 시장에 돈을 푸는 것이고, 줄면(QT) 돈을 거두는 겁니다. QT 가속 시 주식·채권 모두 유동성 부담을 받아요.' },
      { label: 'ON RRP 잔고 (역레포)', text: '은행·MMF가 Fed에 하룻밤 맡겨두는 초과 유동성이에요. 잔고가 줄어드는 건 그 돈이 시장으로 흘러나오는 신호 — 주식·채권에 우호적이에요. 반대로 급증하면 갈 곳 잃은 돈이 많다는 뜻입니다.' },
    ],
  },
  panel2: {
    title: '단기자금시장을 왜 봐야 할까?',
    summary: '은행들끼리 하루짜리 돈을 빌리는 시장이에요. 여기가 막히면 2008년처럼 신용경색이 시작됩니다. 일종의 금융 심장박동 체크예요.',
    items: [
      { label: 'SOFR (담보부 익일금리)', text: '미국 금융기관들이 국채를 담보로 하룻밤 빌리는 실제 금리예요. LIBOR를 대체한 글로벌 기준금리로, 수백조 달러 계약의 기준이 됩니다. 급등하면 단기 자금 수요가 폭발했다는 뜻이에요.' },
      { label: 'IORB (준비금 이자율)', text: 'Fed가 은행 예치금에 주는 금리예요. 사실상 자금시장의 하한선 역할을 합니다. SOFR이 IORB를 크게 웃돌면 담보 부족 신호 — 유동성 경색의 전조일 수 있어요.' },
      { label: 'SOFR - IORB 스프레드', text: '이 둘의 차이가 좁을수록 자금시장이 정상, 벌어질수록 단기 자금 수급에 이상이 생긴 거예요. 2019년 레포 위기처럼 갑자기 튀면 Fed가 긴급 개입하기도 합니다.' },
    ],
  },
  panel3: {
    title: '글로벌 달러·환율을 왜 봐야 할까?',
    summary: '달러는 세계 기축통화예요. 달러가 어디로 흐르는지 보면 글로벌 자금이 안전자산으로 쏠리는지, 위험자산으로 가는지 알 수 있어요.',
    items: [
      { label: 'DXY (달러 인덱스)', text: '6개 주요 통화 대비 달러 강도예요. DXY 상승 = 달러 강세 = 신흥국 부채 부담↑ + 원자재 가격 하락 압력. 반대로 DXY 하락이면 글로벌 위험자산에 우호적인 환경이에요.' },
      { label: 'USD/JPY (달러-엔)', text: '엔화는 대표적인 안전자산이에요. 엔화 강세(USD/JPY 하락) = 글로벌 투자자들이 위험 회피 모드. 엔화 약세 = 캐리트레이드 활성화 = 리스크온 환경. 급격한 엔화 강세 = 글로벌 디레버리징 경고예요.' },
      { label: '금융스트레스 지수 (STLFSI4)', text: 'St.Louis Fed가 18개 금융지표를 종합해 만든 지수예요. 0이 역사적 평균, 양수면 평균보다 스트레스가 높은 상태예요. 1 이상이면 금융시스템에 실질적인 긴장이 생긴 거예요.' },
    ],
  },
  panel4: {
    title: '신용·실물 리스크를 왜 봐야 할까?',
    summary: '주식보다 채권시장이 경기를 더 먼저 읽어요. 특히 HY 스프레드는 "기업들이 망할 것 같냐"를 시장이 직접 가격으로 표현한 지표라 매우 신뢰성이 높아요.',
    items: [
      { label: 'HY 크레딧 스프레드', text: '정크 채권(고위험 기업채)과 국채의 금리 차이예요. 스프레드 확대 = 기업 부도 위험 인식↑ = 경기 하강 우려. 4% 미만이면 안정, 6% 이상이면 실제 신용경색 위험이에요. 주가보다 3~6개월 선행하는 경우가 많아요.' },
      { label: '대출 기준 강화 (DRSDCILM)', text: '은행들이 기업 대출 심사를 얼마나 깐깐하게 하는지 나타내요. 수치가 플러스면 은행들이 대출 문을 좁히고 있다는 뜻 — 실물경제로 가는 자금줄이 조여들고 있는 겁니다. 경기침체 전엔 거의 항상 이 수치가 급등했어요.' },
    ],
  },
}

// ── 상태 판단 ──────────────────────────────────────────────
function getVixStatus(v: number) {
  if (v < 20)  return { label: '안정', dot: '🟢', color: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-500/10' }
  if (v < 30)  return { label: '경계', dot: '🟡', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' }
  return         { label: '위기', dot: '🔴', color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/10' }
}

function getMoveStatus(v: number) {
  if (v < 110) return { label: '안정', dot: '🟢', color: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-500/10' }
  if (v < 150) return { label: '경계', dot: '🟡', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' }
  return         { label: '위기', dot: '🔴', color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/10' }
}

// ── 게이지 바 ─────────────────────────────────────────────
function GaugeBar({ value, max, t1, t2 }: { value: number; max: number; t1: number; t2: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const p1  = (t1 / max) * 100
  const p2  = (t2 / max) * 100
  const fillColor = value < t1 ? 'bg-green-500' : value < t2 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="relative">
      <div className="relative h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${fillColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="absolute top-0 h-2.5 w-0.5 bg-yellow-400/60 rounded" style={{ left: `${p1}%` }} />
      <div className="absolute top-0 h-2.5 w-0.5 bg-red-400/60 rounded"    style={{ left: `${p2}%` }} />
      <div className="flex justify-between text-xs text-gray-700 mt-1 select-none">
        <span>0</span>
        <span style={{ position: 'absolute', left: `${p1}%`, transform: 'translateX(-50%)' }}>{t1}</span>
        <span style={{ position: 'absolute', left: `${p2}%`, transform: 'translateX(-50%)' }}>{t2}</span>
        <span className="ml-auto">{max}+</span>
      </div>
    </div>
  )
}

// ── 인디케이터 카드 ────────────────────────────────────────
function IndicatorCard({
  data, statusFn, gaugeMax, t1, t2, description,
}: {
  data: MacroIndicator
  statusFn: (v: number) => { label: string; dot: string; color: string; border: string; bg: string }
  gaugeMax: number; t1: number; t2: number
  description: string
}) {
  const st = statusFn(data.value)
  const chgColor = data.change > 0 ? 'text-red-400' : data.change < 0 ? 'text-green-400' : 'text-gray-500'
  const chgSign  = data.change >= 0 ? '+' : ''

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 flex flex-col gap-4 ${st.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">{data.name}</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color} ${st.bg}`}>
          {st.dot} {st.label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-5xl font-bold text-white tabular-nums leading-none">
          {data.value.toFixed(2)}
        </span>
        <span className={`text-sm tabular-nums mb-1 ${chgColor}`}>
          {chgSign}{data.change.toFixed(2)} ({chgSign}{data.changePercent.toFixed(2)}%)
        </span>
      </div>
      <GaugeBar value={data.value} max={gaugeMax} t1={t1} t2={t2} />
      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-800 pt-3">
        {description}
      </p>
    </div>
  )
}

// ── 두 지표의 조합 해석 ────────────────────────────────────
function CombinedSignal({ vix, move }: { vix: number; move: number }) {
  const vixHigh  = vix >= 20
  const moveHigh = move >= 110

  let emoji = '🟢', title = 'Risk-On — 시장 안정', desc = 'VIX·MOVE 모두 안정 구간. 위험자산 선호 환경.'
  let bg = 'bg-green-500/10', border = 'border-green-500/20', textColor = 'text-green-300'

  if (vixHigh && moveHigh) {
    emoji = '🔴'; title = '전방위 스트레스'; bg = 'bg-red-500/10'; border = 'border-red-500/20'; textColor = 'text-red-300'
    desc = '주식·채권 동시 변동성 급등. 포지션 축소 고려.'
  } else if (vixHigh && !moveHigh) {
    emoji = '🟠'; title = '주식 스트레스'; bg = 'bg-orange-500/10'; border = 'border-orange-500/20'; textColor = 'text-orange-300'
    desc = '주식시장 패닉, 채권은 안정. 안전자산 수요 가능.'
  } else if (!vixHigh && moveHigh) {
    emoji = '🟡'; title = '채권 스트레스'; bg = 'bg-yellow-500/10'; border = 'border-yellow-500/20'; textColor = 'text-yellow-300'
    desc = '금리 변동성 확대. 장기채권 리스크 주의.'
  }

  return (
    <div className={`${bg} border ${border} rounded-2xl p-4 flex items-start gap-3`}>
      <span className="text-2xl mt-0.5">{emoji}</span>
      <div>
        <p className={`text-sm font-bold ${textColor}`}>{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── Financial Plumbing 컴포넌트들 ─────────────────────────
// ═══════════════════════════════════════════════════════════

function PlumbingLoadingBox() {
  return <div className="h-32 flex items-center justify-center text-gray-600 text-sm animate-pulse">로딩 중...</div>
}

function fmt(v: number, dec = 2) { return v.toFixed(dec) }
function fmtChange(v: number, dec = 2) { return `${v >= 0 ? '+' : ''}${v.toFixed(dec)}` }

function DataRow({
  label, value, unit, change, changeUnit, desc, invert = false,
}: {
  label: string; value: string; unit?: string; change?: string
  changeUnit?: string; desc?: string; invert?: boolean
}) {
  let chgColor = 'text-gray-500'
  if (change) {
    const n = parseFloat(change)
    if (!isNaN(n) && n !== 0) {
      chgColor = invert
        ? (n > 0 ? 'text-red-400' : 'text-green-400')
        : (n > 0 ? 'text-green-400' : 'text-red-400')
    }
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div>
        <span className="text-xs text-gray-400">{label}</span>
        {desc && <span className="text-xs text-gray-600 ml-1.5">{desc}</span>}
      </div>
      <div className="flex items-baseline gap-1.5 text-right">
        <span className="text-sm font-bold text-white tabular-nums">{value}</span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
        {change && (
          <span className={`text-xs tabular-nums ${chgColor}`}>
            {change}{changeUnit ?? ''}
          </span>
        )}
      </div>
    </div>
  )
}

function FsiTag({ v }: { v: number }) {
  if (v < -1)   return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">안정 완화</span>
  if (v < 0)    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">안정</span>
  if (v < 1)    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">경계</span>
  return               <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">스트레스</span>
}

function HyTag({ v }: { v: number }) {
  if (v < 400)  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">안정</span>
  if (v < 600)  return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">경계</span>
  return               <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">위험</span>
}

// ── Panel 헤더 (타이틀 + ? 버튼) ─────────────────────────
function PanelHeader({ title, sub, info }: {
  title: string; sub: string
  info: { title: string; summary: string; items: InfoItem[] }
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      <InfoPopup title={info.title} summary={info.summary} items={info.items} />
    </div>
  )
}

// ── Panel 1: 중앙은행 유동성 ──────────────────────────────
function Panel1({ d }: { d: PlumbingPanel }) {
  const assets = d.fedAssets ? d.fedAssets.value / 1_000_000 : null
  const assetsPrev = d.fedAssets ? d.fedAssets.prev / 1_000_000 : null
  const onrrpB = d.onrrp?.value ?? null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <PanelHeader title="🏦 중앙은행 유동성" sub="Fed 자산 규모 · ON RRP 잔고" info={INFO.panel1} />

      {assets !== null && (
        <DataRow
          label="Fed 자산 규모" value={fmt(assets, 2)} unit="조$"
          change={assetsPrev !== null ? fmtChange(assets - assetsPrev, 2) : undefined}
          changeUnit="조$" desc="(WALCL)" invert={true}
        />
      )}
      {onrrpB !== null && (
        <DataRow
          label="ON RRP 잔고"
          value={onrrpB >= 1000 ? fmt(onrrpB / 1000, 2) : fmt(onrrpB, 0)}
          unit={onrrpB >= 1000 ? '조$' : '십억$'}
          change={d.onrrp ? fmtChange(d.onrrp.change, 1) : undefined}
          changeUnit="십억$" desc="(RRPONTSYD)" invert={true}
        />
      )}

      <div className="text-xs text-gray-600 pt-1">
        ON RRP↓ = 유동성 시장 흡수 감소 → 시중 달러 공급 증가
      </div>
    </div>
  )
}

// ── Panel 2: 단기자금시장 ─────────────────────────────────
function Panel2({ d }: { d: PlumbingPanel }) {
  const spread = (d.sofr && d.iorb) ? d.sofr.value - d.iorb.value : null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <PanelHeader title="💧 단기자금시장" sub="SOFR · IORB · 스프레드" info={INFO.panel2} />

      {d.sofr && (
        <DataRow label="SOFR" value={fmt(d.sofr.value)} unit="%"
          change={fmtChange(d.sofr.change, 3)} changeUnit="%p" desc="익일담보금리" />
      )}
      {d.iorb && (
        <DataRow label="IORB" value={fmt(d.iorb.value)} unit="%"
          change={fmtChange(d.iorb.change, 3)} changeUnit="%p" desc="준비금이자율" />
      )}
      {spread !== null && (
        <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
          Math.abs(spread) < 0.1 ? 'bg-gray-800' :
          spread > 0.1 ? 'bg-yellow-500/10 border border-yellow-500/20' :
          'bg-sky-500/10 border border-sky-500/20'
        }`}>
          <span className="text-gray-400 font-semibold">SOFR − IORB 스프레드</span>
          <span className={`font-bold tabular-nums ${
            Math.abs(spread) < 0.1 ? 'text-gray-300' :
            spread > 0.1 ? 'text-yellow-300' : 'text-sky-300'
          }`}>{fmtChange(spread, 3)}%p</span>
        </div>
      )}
      <div className="text-xs text-gray-600 pt-1">
        SOFR &gt; IORB → 담보 부족 신호. 스프레드 확대 시 단기자금 경색 주의.
      </div>
    </div>
  )
}

// ── Panel 3: 글로벌 달러·환율 ─────────────────────────────
function Panel3({ d }: { d: PlumbingPanel }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <PanelHeader title="💱 글로벌 달러·환율" sub="DXY · USD/JPY · 금융스트레스" info={INFO.panel3} />

      {d.dxy && (
        <DataRow label="DXY (달러 인덱스)" value={fmt(d.dxy.value)}
          change={fmtChange(d.dxy.change)}
          changeUnit={` (${fmtChange(d.dxy.changePercent)}%)`} invert={true} />
      )}
      {d.usdjpy && (
        <DataRow label="USD/JPY" value={fmt(d.usdjpy.value, 2)} unit="엔"
          change={fmtChange(d.usdjpy.change, 2)}
          changeUnit={` (${fmtChange(d.usdjpy.changePercent)}%)`} invert={true} />
      )}
      {d.fsi && (
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs text-gray-400">금융스트레스 지수</span>
            <span className="text-xs text-gray-600 ml-1.5">(STLFSI4)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tabular-nums">{fmt(d.fsi.value, 3)}</span>
            <FsiTag v={d.fsi.value} />
          </div>
        </div>
      )}
      <div className="text-xs text-gray-600 pt-1">
        DXY↑ = 달러 강세 → 신흥국·원자재 압박. FSI &gt; 1 = 금융스트레스 확대.
      </div>
    </div>
  )
}

// ── Panel 4: 신용·실물 리스크 ─────────────────────────────
function Panel4({ d }: { d: PlumbingPanel }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <PanelHeader title="📊 신용·실물 리스크" sub="HY 스프레드 · 대출 기준" info={INFO.panel4} />

      {d.hySpread && (
        <div className="flex items-center justify-between py-2 border-b border-gray-800">
          <div>
            <span className="text-xs text-gray-400">HY 크레딧 스프레드</span>
            <span className="text-xs text-gray-600 ml-1.5">(OAS)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-sm font-bold text-white tabular-nums">{fmt(d.hySpread.value)}</span>
              <span className="text-xs text-gray-500 ml-1">%</span>
              <span className={`text-xs tabular-nums ml-1.5 ${d.hySpread.change > 0 ? 'text-red-400' : d.hySpread.change < 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {fmtChange(d.hySpread.change)}%
              </span>
            </div>
            <HyTag v={d.hySpread.value * 100} />
          </div>
        </div>
      )}
      {d.loanStandards && (
        <DataRow label="대출 기준 강화" value={fmt(d.loanStandards.value, 1)} unit="%"
          change={fmtChange(d.loanStandards.change, 1)} changeUnit="%p"
          desc="(기업대출 net%)" invert={true} />
      )}
      {d.hySpread && (
        <div className={`rounded-lg px-3 py-2 text-xs ${
          d.hySpread.value < 4 ? 'bg-gray-800 text-gray-400' :
          d.hySpread.value < 6 ? 'bg-yellow-500/10 text-yellow-300' :
          'bg-red-500/10 text-red-300'
        }`}>
          {d.hySpread.value < 4
            ? '✅ HY 스프레드 안정 — 기업 신용 위험 낮음'
            : d.hySpread.value < 6
            ? '⚠️ HY 스프레드 경계 — 신용 리스크 확대 주시'
            : '🔴 HY 스프레드 위험 — 기업 부도 위험 상승'}
        </div>
      )}
      <div className="text-xs text-gray-600 pt-1">
        HY 스프레드↑ + 대출기준 강화 동시 → 신용 경색 전조 신호.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 섹터별 자금 로테이션 ─────────────────────────────────
// ═══════════════════════════════════════════════════════════

function SectorRotationSection({ d }: { d: SectorRotationData }) {
  const MAX = Math.max(...d.sectors.map(s => Math.abs(s.monthChangePct)), 1)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">📊 섹터별 자금 로테이션</p>
          <p className="text-xs text-gray-500 mt-0.5">11개 섹터 ETF · 1개월 수익률 순위</p>
        </div>
        <InfoPopup
          title="섹터 로테이션을 왜 볼까?"
          summary="경기 사이클마다 돈이 몰리는 섹터가 달라져요. 어떤 섹터에서 자금이 빠지고 어디로 흐르는지 보면, 지금 시장이 어떤 경기 국면을 예상하는지 알 수 있어요."
          items={[
            { label: '🔥 상위 섹터 (자금 유입)', text: '경기 확장 기대 시: 기술·임의소비재·금융이 강세. 방어 국면 시: 헬스케어·필수소비재·유틸리티가 강세. 상위 섹터가 어디냐에 따라 시장 심리를 읽을 수 있어요.' },
            { label: '❄️ 하위 섹터 (자금 유출)', text: '자금이 빠지는 섹터는 경기 전망이 나쁘거나 금리 환경이 불리할 때예요. 예) 금리 인상기엔 부동산·유틸리티에서 자금이 빠지고, 경기 침체 우려엔 에너지·소재가 약세를 보여요.' },
          ]}
        />
      </div>

      {/* 범례 */}
      <div className="flex gap-3 text-xs text-gray-600">
        <span><span className="text-orange-400">🔥</span> 상위 3 — 자금 유입</span>
        <span><span className="text-blue-400">❄️</span> 하위 3 — 자금 유출</span>
      </div>

      {/* 섹터 바 리스트 */}
      <div className="flex flex-col gap-1">
        {d.sectors.map((s, i) => {
          const isTop    = i < 3
          const isBottom = i >= d.sectors.length - 3
          const pct      = s.monthChangePct
          const barW     = Math.abs(pct) / MAX * 100
          const barColor = pct >= 5  ? 'bg-red-500' :
                           pct >= 2  ? 'bg-orange-400' :
                           pct >= 0  ? 'bg-emerald-600' :
                           pct >= -2 ? 'bg-sky-600' :
                                       'bg-blue-500'
          const textColor = pct > 0 ? 'text-emerald-400' : 'text-red-400'

          return (
            <div key={s.symbol} className="flex items-center gap-2 py-1 text-xs">
              {/* 랭크 배지 */}
              <span className="w-4 text-center shrink-0">
                {isTop ? '🔥' : isBottom ? '❄️' : <span className="text-gray-700">{i + 1}</span>}
              </span>
              {/* 이모지 + 이름 */}
              <span className="w-4 text-center shrink-0">{s.emoji}</span>
              <span className="w-16 text-gray-300 truncate shrink-0">{s.name}</span>
              {/* 바 */}
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} opacity-80 transition-all`}
                  style={{ width: `${barW}%` }}
                />
              </div>
              {/* 1개월 % */}
              <span className={`w-14 text-right tabular-nums font-semibold shrink-0 ${textColor}`}>
                {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
              </span>
              {/* 오늘 % */}
              <span className={`w-12 text-right tabular-nums text-gray-600 shrink-0`}>
                {s.dayChangePct >= 0 ? '+' : ''}{s.dayChangePct.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-gray-700 pt-1 border-t border-gray-800">
        막대 = 1개월 변화율 &nbsp;·&nbsp; 오른쪽 작은 숫자 = 오늘 변화율
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── TQQQ/SQQQ 레버리지 심리 ──────────────────────────────
// ═══════════════════════════════════════════════════════════

function LeverageSparkline({ data, bullish }: { data: number[]; bullish: boolean }) {
  if (data.length < 2) return null
  const W = 400, H = 48
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const xStep = W / (data.length - 1)
  const yPos  = (v: number) => H - ((v - min) / range) * H * 0.85 - H * 0.08
  const pts   = data.map((v, i) => `${i * xStep},${yPos(v)}`).join(' ')
  const area  = `0,${H} ${pts} ${(data.length - 1) * xStep},${H}`
  const color = bullish ? '#22c55e' : '#ef4444'
  const gid   = `lev-${bullish ? 'b' : 'r'}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 48, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function LeverageSentimentSection({ d }: { d: LeverageSentimentData }) {
  const bullish   = d.signalType === 'bullish'
  const bearish   = d.signalType === 'bearish'
  const signalBg  = bullish ? 'bg-green-700/80 text-green-100' :
                   bearish  ? 'bg-red-700/80 text-red-100'     :
                              'bg-yellow-900/60 text-yellow-200'

  const fmtVol = (v: number) => v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">⚡ TQQQ / SQQQ 레버리지 심리</p>
            <p className="text-xs text-gray-500 mt-0.5">3배 강세 vs 3배 약세 베팅 비교</p>
          </div>
          <InfoPopup
            title="TQQQ/SQQQ를 왜 볼까?"
            summary="TQQQ는 나스닥을 3배로 추종하는 강세 레버리지 ETF, SQQQ는 반대로 3배 하락에 베팅하는 약세 ETF예요. 어느 쪽에 더 많은 돈이 몰리는지 보면 시장 참여자들의 극단적 베팅 방향을 알 수 있어요."
            items={[
              { label: '📈 TQQQ 강세 (비율 상승)', text: 'TQQQ/SQQQ 비율이 오른다 = 3배 강세 베팅이 약세 베팅을 압도. 투자자들이 나스닥 급등을 기대하며 고위험 베팅을 늘리는 탐욕 국면이에요. 과열 신호일 수도 있어요.' },
              { label: '📉 SQQQ 강세 (비율 하락)', text: 'TQQQ/SQQQ 비율 하락 = 약세 베팅이 강세 베팅을 앞지름. 헤지펀드 등이 하락에 베팅하거나, 개인 투자자들이 공포에 빠진 상태예요. 역발상 관점에선 바닥 신호일 수 있어요.' },
            ]}
          />
        </div>

        {/* TQQQ vs SQQQ 나란히 */}
        <div className="grid grid-cols-2 gap-3">
          {[d.tqqq, d.sqqq].map(item => {
            const isT   = item.symbol === 'TQQQ'
            const color = isT ? 'text-green-400' : 'text-red-400'
            const bg    = isT ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
            const chgColor = item.dayChangePct > 0 ? 'text-green-400' : item.dayChangePct < 0 ? 'text-red-400' : 'text-gray-500'
            const volRatio = item.avgVolume > 0 ? item.volume / item.avgVolume : 1
            return (
              <div key={item.symbol} className={`rounded-xl border px-3 py-2.5 flex flex-col gap-1 ${bg}`}>
                <p className={`text-xs font-bold ${color}`}>{item.symbol}</p>
                <p className="text-base font-bold text-white tabular-nums">${item.price.toFixed(2)}</p>
                <p className={`text-xs tabular-nums ${chgColor}`}>
                  {item.dayChangePct >= 0 ? '+' : ''}{item.dayChangePct.toFixed(2)}%
                  <span className="text-gray-600 ml-1">오늘</span>
                </p>
                <p className={`text-xs tabular-nums ${item.monthChangePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.monthChangePct >= 0 ? '+' : ''}{item.monthChangePct.toFixed(1)}%
                  <span className="text-gray-600 ml-1">1개월</span>
                </p>
                <div className="mt-1">
                  <p className="text-xs text-gray-600 mb-0.5">거래량</p>
                  <p className="text-xs text-gray-400 tabular-nums">{fmtVol(item.volume)}</p>
                  <div className="h-1 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isT ? 'bg-green-500' : 'bg-red-500'} opacity-70`}
                      style={{ width: `${Math.min(volRatio * 50, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-700 mt-0.5">평균 대비 {(volRatio * 100).toFixed(0)}%</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 거래량 심리 게이지 */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>약세 (SQQQ)</span>
            <span className="text-gray-500">거래량 비중</span>
            <span>강세 (TQQQ)</span>
          </div>
          <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all ${bullish ? 'bg-green-500' : bearish ? 'bg-red-500' : 'bg-yellow-500'} opacity-70`}
              style={{ width: `${d.volumeScore}%` }}
            />
            {/* 중앙선 */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-600" />
          </div>
          <div className="flex justify-between text-xs text-gray-700 mt-0.5">
            <span>0%</span>
            <span className={`font-semibold ${bullish ? 'text-green-400' : bearish ? 'text-red-400' : 'text-yellow-400'}`}>
              TQQQ {d.volumeScore}%
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* 5일 비율 변화 */}
        <div className="text-xs text-gray-500">
          TQQQ/SQQQ 비율 5일 변화:
          <span className={`ml-1.5 font-semibold tabular-nums ${d.ratio5dChangePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {d.ratio5dChangePct >= 0 ? '+' : ''}{d.ratio5dChangePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 비율 스파크라인 */}
      <LeverageSparkline data={d.ratioHistory} bullish={d.ratio5dChangePct >= 0} />

      {/* 신호 */}
      <div className={`text-center text-xs font-bold py-2 tracking-widest uppercase ${signalBg}`}>
        {d.signal}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 자본 이동 비율 — 카드별 팝업 설명 ────────────────────
// ═══════════════════════════════════════════════════════════

const RATIO_INFO: Record<string, { title: string; summary: string; items: InfoItem[] }> = {
  'spy-tlt': {
    title: 'SPY / TLT — 왜 비교할까?',
    summary: 'SPY는 미국 주식시장 전체, TLT는 20년 이상 미국 장기 국채 ETF예요. 투자자들이 어디에 돈을 넣는지 보면, 지금이 "위험을 감수할 시기"인지 "안전하게 피할 시기"인지 알 수 있어요.',
    items: [
      {
        label: '📈 비율 상승 → 주식 선호 (Risk-On)',
        text: '경기 회복 기대가 크고 투자자들이 수익을 쫓아 주식에 몰릴 때예요. 예) 2020년 코로나 백신 발표 후 주식이 급등하며 이 비율이 사상 최고치를 경신했어요.',
      },
      {
        label: '📉 비율 하락 → 채권으로 대피 (Risk-Off)',
        text: '경기침체 우려, 금리 쇼크, 전쟁 등 불확실성이 커지면 투자자들이 주식을 팔고 국채로 숨어요. 예) 2022년 Fed 금리 급인상기에 주식은 폭락하고 TLT 수요가 폭증했어요.',
      },
    ],
  },
  'qqq-dia': {
    title: 'QQQ / DIA — 왜 비교할까?',
    summary: 'QQQ는 애플·엔비디아·구글 같은 나스닥100 기술·성장주, DIA는 JP모건·월마트 같은 다우존스 전통·가치주예요. 금리 방향에 따라 두 섹터가 반대로 움직이는 경향이 있어요.',
    items: [
      {
        label: '📈 비율 상승 → 성장주(나스닥) 선호',
        text: '금리 하락 기대나 AI·기술 붐일 때 성장주가 유리해요. 미래 수익이 높을수록 낮은 금리로 할인할수록 가치가 올라가거든요. 예) 2023~2024년 AI 붐으로 QQQ가 DIA를 크게 앞질렀어요.',
      },
      {
        label: '📉 비율 하락 → 가치주(다우존스) 선호',
        text: '금리가 높거나 경기 불확실성이 클 때 배당·실적이 탄탄한 전통 기업이 빛나요. 예) 2022년 금리인상 쇼크 때 나스닥이 -33% 폭락하는 동안 다우존스는 상대적으로 선방했어요.',
      },
    ],
  },
  'btc-gold': {
    title: 'BTC / GOLD — 왜 비교할까?',
    summary: '비트코인과 금은 둘 다 "인플레이션 헤지" 자산으로 불리지만, 성격이 달라요. 금은 5,000년 역사의 안전자산, BTC는 유동성·투기 심리를 먹고 자라는 위험자산이에요. 이 둘을 비교하면 시장이 지금 얼마나 겁 없이 베팅하고 있는지 알 수 있어요.',
    items: [
      {
        label: '📈 비율 상승 → BTC 선호 (탐욕 국면)',
        text: '유동성이 풍부하고 투자자들이 공격적으로 베팅할 때예요. 예) 2020~2021년 제로금리 + 양적완화 시기에 BTC가 금을 수십 배 앞지르며 이 비율이 폭등했어요.',
      },
      {
        label: '📉 비율 하락 → 금으로 대피 (공포 국면)',
        text: '불확실성이 커지면 BTC는 투기자산으로 분류되어 팔리고, 금이 반사이익을 얻어요. 예) 2022년 테라-루나 붕괴, FTX 파산 사태 때 BTC가 -60% 폭락하는 동안 금은 상대적으로 견조했어요.',
      },
    ],
  },
  'copper-gold': {
    title: 'COPPER / GOLD — 왜 비교할까?',
    summary: '구리는 "닥터 코퍼(Dr. Copper)"라는 별명이 있어요. 반도체, 전선, 건설 등 산업 전반에 쓰이기 때문에 경기가 좋아지면 수요가 늘고 가격이 올라요. 반면 금은 경기 불안 시 오르는 안전자산이에요. 이 두 비율로 경기 사이클을 6개월 정도 먼저 예측할 수 있어요.',
    items: [
      {
        label: '📈 비율 상승 → 경기 확장 신호',
        text: '제조업·건설·전기차 수요가 늘어 구리 가격이 금보다 더 오를 때예요. 예) 2021년 글로벌 경기 회복기에 구리 가격이 사상 최고치를 기록하며 이 비율이 급등했어요.',
      },
      {
        label: '📉 비율 하락 → 경기 수축 경고',
        text: '산업 수요가 줄고 안전자산인 금으로 자금이 몰릴 때예요. 예) 2020년 코로나 초기, 2008년 금융위기 직전에 이 비율이 급격히 떨어지며 경기침체를 먼저 알려줬어요.',
      },
    ],
  },
}

// ═══════════════════════════════════════════════════════════
// ── 자본 이동 비율 컴포넌트 ───────────────────────────────
// ═══════════════════════════════════════════════════════════

// 스파크라인 SVG — 카드별 고유 ID로 그라데이션 충돌 방지
function Sparkline({ data, positive, uid }: { data: number[]; positive: boolean; uid: string }) {
  if (data.length < 2) return null
  const W = 400, H = 72
  const padX = 0, padT = 6, padB = 0
  const plotW = W - padX * 2
  const plotH = H - padT - padB

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || min * 0.02 || 1
  const xStep = plotW / (data.length - 1)
  const yPos  = (v: number) => padT + (1 - (v - min) / range) * plotH

  const pts  = data.map((v, i) => `${padX + i * xStep},${yPos(v)}`).join(' ')
  const area = `${padX},${H} ${pts} ${padX + (data.length - 1) * xStep},${H}`

  const strokeColor = positive ? '#22c55e' : '#ef4444'
  const fillColor   = positive ? '#22c55e' : '#ef4444'
  const gradId = `sg-${uid}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={fillColor} stopOpacity="0.45" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={strokeColor} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// 신호 배지 스타일
function signalStyle(type: RatioCard['signalType']) {
  switch (type) {
    case 'positive': return 'bg-green-700/80 text-green-100'
    case 'negative': return 'bg-red-700/80 text-red-100'
    default:         return 'bg-yellow-900/60 text-yellow-200'
  }
}

// 자본 이동 비율 카드
function RatioCardComp({ card }: { card: RatioCard }) {
  const isPos = card.ratioChangePct >= 0
  const sparkPos = card.history.length >= 2
    ? card.history[card.history.length - 1] >= card.history[0]
    : isPos

  // 표시용 심볼 (짧게)
  const numLabel = card.num.symbol.replace('-USD', '').replace('=F', '')
  const denLabel = card.den.symbol.replace('-USD', '').replace('=F', '')

  // 비율값 표시 (소수점 자리수 조정)
  const ratioDisplay = card.ratio < 0.01
    ? card.ratio.toFixed(4)
    : card.ratio < 1
    ? card.ratio.toFixed(4)
    : card.ratio < 100
    ? card.ratio.toFixed(2)
    : card.ratio.toFixed(1)

  const borderColor = sparkPos ? 'border-green-900/60' : 'border-red-900/60'

  return (
    <div className={`bg-gray-900 border ${borderColor} rounded-2xl overflow-hidden flex flex-col`}>
      {/* 상단 정보 */}
      <div className="px-3 pt-3 pb-1 flex flex-col gap-1.5">
        {/* 타이틀 + ? 버튼 */}
        <div className="flex items-start justify-between gap-1">
          <div>
            <p className="text-xs font-bold text-white tracking-wide">{card.pairLabel}</p>
            <p className="text-xs text-gray-600 leading-tight">{card.description}</p>
          </div>
          {RATIO_INFO[card.id] && (
            <InfoPopup
              title={RATIO_INFO[card.id].title}
              summary={RATIO_INFO[card.id].summary}
              items={RATIO_INFO[card.id].items}
            />
          )}
        </div>

        {/* 비율 수치 + 변화율 */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-xl font-bold tabular-nums leading-none ${sparkPos ? 'text-green-400' : 'text-red-400'}`}>
            {ratioDisplay}
          </span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            isPos ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
          }`}>
            {isPos ? '+' : ''}{card.ratioChangePct.toFixed(2)}%
          </span>
          <span className="text-xs text-gray-600 tabular-nums">
            5일 {card.change5dPct >= 0 ? '+' : ''}{card.change5dPct.toFixed(2)}%
          </span>
        </div>

        {/* 개별 등락 */}
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">{numLabel}{' '}
            <span className={card.num.changePercent >= 0 ? 'text-red-400' : 'text-green-400'}>
              {card.num.changePercent >= 0 ? '+' : ''}{card.num.changePercent.toFixed(2)}%
            </span>
          </span>
          <span className="text-gray-600">{denLabel}{' '}
            <span className={card.den.changePercent >= 0 ? 'text-red-400' : 'text-green-400'}>
              {card.den.changePercent >= 0 ? '+' : ''}{card.den.changePercent.toFixed(2)}%
            </span>
          </span>
        </div>
      </div>

      {/* 스파크라인 — 카드 가득 채우기 */}
      <div className="w-full">
        <Sparkline data={card.history} positive={sparkPos} uid={card.id} />
      </div>

      {/* 신호 배지 */}
      <div className={`text-center text-xs font-bold py-2 tracking-widest uppercase ${signalStyle(card.signalType)}`}>
        {card.signal}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 메인 페이지 ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function MacroPage() {
  const [data,     setData]     = useState<MacroAPIData | null>(null)
  const [plumbing, setPlumbing] = useState<PlumbingPanel | null>(null)
  const [capital,  setCapital]  = useState<CapitalRatioData | null>(null)
  const [sectors,  setSectors]  = useState<SectorRotationData | null>(null)
  const [leverage, setLeverage] = useState<LeverageSentimentData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [pLoading, setPLoading] = useState(true)
  const [cLoading, setCLoading] = useState(true)
  const [sLoading, setSLoading] = useState(true)
  const [lLoading, setLLoading] = useState(true)
  const [error,    setError]    = useState(false)

  const load = async () => {
    setLoading(true); setError(false)
    try {
      const res = await fetch('/api/macro')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError(true) }
    finally { setLoading(false) }
  }
  const loadPlumbing = async () => {
    setPLoading(true)
    try { const r = await fetch('/api/plumbing');    if (r.ok) setPlumbing(await r.json()) } catch {}
    finally { setPLoading(false) }
  }
  const loadCapital = async () => {
    setCLoading(true)
    try { const r = await fetch('/api/capital-ratio'); if (r.ok) setCapital(await r.json()) } catch {}
    finally { setCLoading(false) }
  }
  const loadSectors = async () => {
    setSLoading(true)
    try { const r = await fetch('/api/sector-rotation'); if (r.ok) setSectors(await r.json()) } catch {}
    finally { setSLoading(false) }
  }
  const loadLeverage = async () => {
    setLLoading(true)
    try { const r = await fetch('/api/leverage-sentiment'); if (r.ok) setLeverage(await r.json()) } catch {}
    finally { setLLoading(false) }
  }

  useEffect(() => {
    load(); loadPlumbing(); loadCapital(); loadSectors(); loadLeverage()
    // FRED cold-start retry: plumbing is the only FRED route here;
    // retry without resetting loading state so there's no flicker
    const retryId = setTimeout(async () => {
      try { const r = await fetch('/api/plumbing'); if (r.ok) setPlumbing(await r.json()) } catch {}
      finally { setPLoading(false) }
    }, 2000)
    const id = setInterval(() => {
      load(); loadPlumbing(); loadCapital(); loadSectors(); loadLeverage()
    }, 5 * 60 * 1000)
    return () => { clearTimeout(retryId); clearInterval(id) }
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500 text-sm animate-pulse">데이터 로딩 중...</p>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
      <p className="text-gray-500 text-sm">데이터를 불러오지 못했습니다</p>
      <button onClick={load} className="text-xs text-blue-400 hover:text-blue-300 underline">다시 시도</button>
    </div>
  )

  const updateTime = new Date(data.timestamp).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-8">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">거시경제 모니터</h1>
            <p className="text-xs text-gray-500 mt-0.5">금융시장 변동성 · 유동성 배관</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-600">{updateTime} 기준</span>
            <RefreshBadge />
          </div>
        </div>

        {/* ── Section 1: 변동성 지표 ── */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">변동성 지표</p>
            <InfoPopup
              title={INFO.vixMove.title}
              summary={INFO.vixMove.summary}
              items={INFO.vixMove.items}
            />
          </div>

          <CombinedSignal vix={data.vix.value} move={data.move.value} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <IndicatorCard data={data.vix} statusFn={getVixStatus} gaugeMax={50} t1={20} t2={30}
              description="주식시장 변동성. S&P 500 옵션의 내재변동성에서 산출. 상승 = 시장 불안·공포. 20 이하 안정 / 20~30 경계 / 30+ 위기." />
            <IndicatorCard data={data.move} statusFn={getMoveStatus} gaugeMax={200} t1={110} t2={150}
              description="채권시장 변동성. 미국 국채 옵션의 내재변동성 지수. 상승 = 금리 불확실성 확대. 110 이하 안정 / 110~150 경계 / 150+ 위기." />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">임계값 가이드</p>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="flex flex-col gap-1.5">
                <p className="text-gray-300 font-semibold mb-0.5">VIX</p>
                <span className="text-green-400">● &lt;20 &nbsp;안정 — 시장 침착</span>
                <span className="text-yellow-400">● 20~30 경계 — 불확실성 확대</span>
                <span className="text-red-400">● 30+ &nbsp;위기 — 공포 국면</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-gray-300 font-semibold mb-0.5">MOVE</p>
                <span className="text-green-400">● &lt;110 &nbsp;안정 — 채권 안정</span>
                <span className="text-yellow-400">● 110~150 경계 — 금리 불안</span>
                <span className="text-red-400">● 150+ &nbsp;&nbsp;위기 — 채권시장 혼란</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: 섹터별 자금 로테이션 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            섹터별 자금 로테이션
          </p>
          {sLoading
            ? <div className="h-40 flex items-center justify-center text-gray-600 text-sm animate-pulse bg-gray-900 border border-gray-800 rounded-2xl">로딩 중...</div>
            : sectors ? <SectorRotationSection d={sectors} />
            : <div className="text-xs text-gray-600 text-center py-8">데이터 없음</div>
          }
        </div>

        {/* ── Section 3: TQQQ/SQQQ 레버리지 심리 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            레버리지 심리
          </p>
          {lLoading
            ? <div className="h-40 flex items-center justify-center text-gray-600 text-sm animate-pulse bg-gray-900 border border-gray-800 rounded-2xl">로딩 중...</div>
            : leverage ? <LeverageSentimentSection d={leverage} />
            : <div className="text-xs text-gray-600 text-center py-8">데이터 없음</div>
          }
        </div>

        {/* ── Section 4: 자본 이동 비율 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            자본 이동 비율 (Capital Migration)
          </p>
          {cLoading ? (
            <div className="h-32 flex items-center justify-center text-gray-600 text-sm animate-pulse">로딩 중...</div>
          ) : capital ? (
            <div className="grid grid-cols-2 gap-3">
              {capital.cards.map(card => (
                <RatioCardComp key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-600 text-center py-8">데이터 없음</div>
          )}
        </div>

        {/* ── Section 4: Financial Plumbing ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            금융 배관 (Financial Plumbing)
          </p>

          {pLoading ? (
            <PlumbingLoadingBox />
          ) : plumbing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel1 d={plumbing} />
              <Panel2 d={plumbing} />
              <Panel3 d={plumbing} />
              <Panel4 d={plumbing} />
            </div>
          ) : (
            <div className="text-xs text-gray-600 text-center py-8">
              FRED 데이터를 불러오지 못했습니다
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
