'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { YieldsAPIData, YieldPoint } from '@/app/api/yields/route'
import type { CommoditiesAPIData, CommodityItem } from '@/app/api/commodities/route'
import type { MmfTipsData } from '@/app/api/mmf-tips/route'
import type { LiquidityFlowData, FlowSeries } from '@/app/api/liquidity-flow/route'
import type { InflationData, InflationRow } from '@/app/api/inflation/route'
import RefreshBadge from '@/components/RefreshBadge'

// ── 국채 수익률 곡선 SVG ───────────────────────────────────
function YieldCurveChart({ yields }: { yields: YieldPoint[] }) {
  const W = 480, H = 180
  const padL = 48, padR = 16, padT = 28, padB = 28
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const vals = yields.map(y => y.value).filter(v => v > 0)
  if (vals.length < 2) return null

  const minY = Math.max(0, Math.min(...vals) - 0.5)
  const maxY = Math.max(...vals) + 0.5

  const xPos = (i: number) => padL + (i / (yields.length - 1)) * plotW
  const yPos = (v: number) => padT + (1 - (v - minY) / (maxY - minY)) * plotH

  const linePoints = yields.map((y, i) => `${xPos(i)},${yPos(y.value)}`).join(' ')
  const areaPoints = `${padL},${padT + plotH} ${linePoints} ${W - padR},${padT + plotH}`

  const threeM = yields.find(y => y.label === '3M')?.value ?? 0
  const tenY   = yields.find(y => y.label === '10Y')?.value ?? 0
  const isInverted = threeM > tenY && tenY > 0
  const stroke = isInverted ? '#f87171' : '#34d399'
  const fill   = isInverted ? '#f87171' : '#34d399'

  const gridCount = 4
  const gridVals = Array.from({ length: gridCount + 1 }, (_, i) =>
    minY + (i / gridCount) * (maxY - minY)
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
      {gridVals.map(v => (
        <g key={v}>
          <line x1={padL} y1={yPos(v)} x2={W - padR} y2={yPos(v)} stroke="#1f2937" strokeWidth="1" />
          <text x={padL - 6} y={yPos(v) + 4} textAnchor="end" fontSize="9" fill="#4b5563">
            {v.toFixed(2)}
          </text>
        </g>
      ))}
      <polygon points={areaPoints} fill={fill} fillOpacity="0.08" />
      <polyline points={linePoints} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {yields.map((y, i) => (
        <g key={y.label}>
          <circle cx={xPos(i)} cy={yPos(y.value)} r="4" fill={stroke} />
          <text x={xPos(i)} y={yPos(y.value) - 10} textAnchor="middle" fontSize="10" fill="#d1d5db" fontWeight="600">
            {y.value.toFixed(2)}%
          </text>
          <text x={xPos(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
            {y.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── 원자재 모멘텀 바 ──────────────────────────────────────
function CommodityBar({ item }: { item: CommodityItem }) {
  const MAX_PCT = 10
  const pct = item.monthChange
  const clamp = Math.max(-MAX_PCT, Math.min(MAX_PCT, pct))
  const barPct = Math.abs(clamp) / MAX_PCT * 100

  const barColor =
    pct >= 5  ? 'bg-red-500' :
    pct >= 2  ? 'bg-orange-400' :
    pct >= 0  ? 'bg-emerald-600' :
    pct >= -2 ? 'bg-sky-600' :
    pct >= -5 ? 'bg-sky-500' :
               'bg-blue-400'

  const textColor =
    pct >= 5  ? 'text-red-400' :
    pct >= 0  ? 'text-emerald-400' :
               'text-sky-400'

  const isPos = pct >= 0

  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      <span className="w-5 shrink-0 text-center">{item.emoji}</span>
      <span className="w-20 text-gray-300 truncate shrink-0">{item.name}</span>
      <div className="flex-1 flex items-center gap-0.5 min-w-0">
        <div className="flex-1 flex justify-end h-4">
          {!isPos && (
            <div className={`h-full rounded-l ${barColor} opacity-80`} style={{ width: `${barPct}%` }} />
          )}
        </div>
        <div className="w-px h-5 bg-gray-600 shrink-0" />
        <div className="flex-1 h-4">
          {isPos && (
            <div className={`h-full rounded-r ${barColor} opacity-80`} style={{ width: `${barPct}%` }} />
          )}
        </div>
      </div>
      <span className={`w-14 text-right tabular-nums font-semibold shrink-0 ${textColor}`}>
        {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
      </span>
    </div>
  )
}

// ── 미니 스파크라인 SVG ───────────────────────────────────
function MiniSparkline({ data, color = '#60a5fa' }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="h-10 bg-gray-800/40 rounded" />
  const W = 200, H = 40, pad = 2
  const minV = Math.min(...data)
  const maxV = Math.max(...data)
  const range = maxV - minV || 1

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - 2 * pad)
    const y = pad + (1 - (v - minV) / range) * (H - 2 * pad)
    return `${x},${y}`
  }).join(' ')

  const area = `${pad},${H - pad} ${pts} ${W - pad},${H - pad}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10" preserveAspectRatio="none">
      <polygon points={area} fill={color} fillOpacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── 인플레이션 셀 색상 ────────────────────────────────────
function yoyColor(yoy: number): string {
  if (yoy < 0)   return 'bg-blue-500/30 text-blue-200'
  if (yoy < 1.5) return 'bg-cyan-500/20 text-cyan-300'
  if (yoy < 2.5) return 'bg-emerald-500/25 text-emerald-200'
  if (yoy < 3.5) return 'bg-yellow-500/20 text-yellow-300'
  if (yoy < 5)   return 'bg-orange-500/25 text-orange-300'
  return                 'bg-red-500/30 text-red-300'
}

// ── 월 포맷: "2025-01-01" → "25.1" ──────────────────────
function formatMonth(dateStr: string): string {
  const parts = dateStr.split('-')
  return `${parts[0].slice(2)}.${parseInt(parts[1], 10)}`
}

// ── 정보 팝업 ────────────────────────────────────────────
interface InfoItem { label: string; text: string }

function InfoPopup({ title, summary, items }: {
  title: string; summary: string; items: InfoItem[]
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
          <button onClick={() => setOpen(false)}
            className="shrink-0 text-gray-500 hover:text-white text-xl leading-none mt-0.5">×</button>
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
      <button ref={btnRef} onClick={() => setOpen(v => !v)}
        className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-xs font-bold flex items-center justify-center transition-colors shrink-0"
        aria-label="설명 보기">?</button>
      {mounted && open && createPortal(popup, document.body)}
    </>
  )
}

// ── 팝업 내용 정의 ────────────────────────────────────────
const INFO = {
  mmfTips: {
    title: 'MMF 자금흐름 + TIPS 실질금리를 왜 봐야 할까?',
    summary: 'MMF는 투자자들의 "안전 대피 수준"을 실시간으로 보여주고, TIPS 실질금리는 주식·채권의 실질 할인율 역할을 해요. 이 둘을 같이 보면 시장이 지금 위험을 얼마나 두려워하는지 파악할 수 있어요.',
    items: [
      {
        label: 'MMF 총자산 — 공포 온도계',
        text: '머니마켓펀드는 주식·채권 대신 단기 국채·CD에만 투자하는 초안전 상품이에요. 주식 시장이 흔들리면 투자자들이 MMF로 피신하면서 잔액이 급증해요. 반대로 잔액이 줄기 시작하면 그 돈이 다시 위험자산으로 돌아온다는 신호입니다. 2025년 현재 약 7조 달러가 MMF에 쌓여 있어요.',
      },
      {
        label: '1W · 4W 변화 — 방향이 핵심',
        text: '수치 절대값보다 방향이 중요해요. 4주 연속 유입이면 위험회피 강화 중, 4주 연속 유출이면 위험선호 회복 중이에요. 주가 바닥권에서 MMF 유출이 급증하면 랠리 시작의 신호일 수 있어요.',
      },
      {
        label: 'TIPS 실질금리 — 주식 밸류에이션의 적',
        text: '명목 국채금리에서 시장의 기대인플레이션을 뺀 값이에요. 이게 높아질수록 "안전하게 이 정도 실질 수익을 보장받을 수 있는데 굳이 위험한 주식을 살 이유가 있나?" 라는 논리로 주식 밸류에이션이 압박받아요. 2022년 실질금리 0%→2%+ 급등이 나스닥 -33% 폭락의 핵심 원인이었어요.',
      },
      {
        label: '5Y vs 10Y 실질금리 연관성',
        text: '5Y가 10Y보다 높으면 단기 물가 압박이 더 심한 것, 10Y가 더 높으면 장기적 긴축 우려가 크다는 의미예요. 두 금리가 동시에 하락하면 Fed 피벗 기대감이 퍼지는 구간이에요.',
      },
    ],
  },
  rrpSofr: {
    title: 'ON RRP + SOFR 유동성 흐름을 왜 봐야 할까?',
    summary: '금융 시스템 안에 "물"이 얼마나 차 있는지 보는 수위계예요. RRP가 줄어들면 시장에 유동성이 넘치는 것이고, SOFR이 튀면 단기 자금이 부족하다는 경고입니다.',
    items: [
      {
        label: 'ON RRP 잔액 — 시중 유동성의 역방향 지표',
        text: 'Fed가 은행·MMF로부터 하루짜리로 돈을 빌려가는 창구예요. 잔액이 많다 = 시장에 돈이 너무 많아서 갈 곳이 없다는 뜻이에요. 반대로 잔액이 줄면 그 돈이 국채 매입·대출·주식 투자로 흘러들어 가요. 2022~2024년 2.5조$ → 수백억$ 감소는 역대급 유동성 방출이었어요.',
      },
      {
        label: 'RRP 감소 트렌드가 왜 중요한가',
        text: 'QT(양적 긴축)로 Fed가 돈을 거둬가도, RRP에 쌓인 돈이 시장으로 나오면 실제 유동성 충격이 완화돼요. RRP가 소진되면 그때부터는 QT가 진짜 시장 유동성을 건드리게 됩니다. 지금 RRP 잔액이 어느 수준인지가 "유동성 절벽"의 타이밍을 가늠하는 핵심이에요.',
      },
      {
        label: 'SOFR — 실제 단기 자금 비용',
        text: '미국 금융기관들이 미국 국채를 담보로 하루짜리 자금을 조달하는 실제 금리예요. 이론상 Fed 기준금리 범위 안에서 움직여야 정상인데, 크게 이탈하면 담보 자산 부족이나 자금 수요 폭증 신호예요. 2019년 레포 위기 때 SOFR이 하루에 10%p 급등하면서 Fed가 긴급 개입했어요.',
      },
      {
        label: 'RRP ↓ + SOFR 안정 = 골디락스 유동성',
        text: 'RRP 잔액이 줄면서 SOFR이 안정적이면 유동성이 시스템에 풍부하게 공급되는 이상적인 상태예요. 반면 RRP 소진 후 SOFR 급등이 나타나면 유동성 경색의 초기 신호이니 주의가 필요해요.',
      },
    ],
  },
  inflation: {
    title: '인플레이션 히트맵을 왜 봐야 할까?',
    summary: 'Fed 금리 결정의 99%는 인플레이션 데이터로 결정돼요. 색상이 빨갈수록 금리 인하는 멀어지고, 초록일수록 가까워져요. 히트맵 하나로 금리 방향을 직관적으로 읽을 수 있어요.',
    items: [
      {
        label: 'CPI vs 근원 CPI — 노이즈 vs 신호',
        text: '헤드라인 CPI는 에너지·식품 가격이 포함돼 월별 변동이 커요. 유가 하나로 수치가 확 내려갈 수 있어요. 근원 CPI(음식·에너지 제외)는 훨씬 끈적하고 지속적이에요. Fed는 헤드라인을 보되 근원 CPI를 더 신뢰해요. 두 수치가 같이 내려와야 진짜 물가 하락이에요.',
      },
      {
        label: 'PCE · 근원 PCE — Fed의 공식 타겟',
        text: 'Fed가 "물가 안정"을 판단할 때 공식 기준으로 쓰는 지표예요. 목표치는 근원 PCE 2%예요. CPI보다 약 0.3~0.5%p 낮게 나오는 경향이 있어서, CPI가 3%여도 PCE가 2.5%면 Fed 입장에서는 그리 나쁘지 않아요. 이 수치가 2% 이상 유지되는 한 금리 인하는 어렵습니다.',
      },
      {
        label: 'PPI 최종수요 — 1~2개월 선행 지표',
        text: '기업들이 받는 도매 판매가격이에요. PPI가 오르면 기업들이 원가 상승분을 소비자 가격(CPI)에 전가할 가능성이 높아져요. PPI가 먼저 꺾이면 CPI도 곧 따라 내려오는 경향이 있어요. 특히 PPI 서비스 항목은 임금과 연동되니 주목해야 해요.',
      },
      {
        label: '평균 시간급 — 서비스 인플레의 뿌리',
        text: '임금이 오르면 기업 원가가 오르고 → 서비스 가격이 오르고 → 물가가 잡히지 않는 악순환이 생겨요. 특히 미국은 GDP의 70%가 소비인데, 임금 상승이 지속되면 소비가 계속 받쳐줘서 인플레가 끈적하게 됩니다. Fed가 가장 걱정하는 시나리오가 "임금-물가 나선형"이에요.',
      },
      {
        label: '색상으로 금리 방향 읽기',
        text: '초록(1.5~2.5%) = Fed 목표 달성 → 금리 인하 가능. 노랑/주황(2.5~5%) = 아직 경계 → 동결 또는 인상. 빨강(5%+) = 과열 → 추가 인상 위험. 파랑(0% 미만) = 디플레 → 경기침체 우려로 인하 가능. 6개월 열이 점점 초록으로 변해가면 금리 인하 사이클 진입 신호예요.',
      },
    ],
  },
}

// ── 로딩/에러 공통 ─────────────────────────────────────────
function LoadingBox() {
  return <div className="h-40 flex items-center justify-center text-gray-600 text-sm animate-pulse">로딩 중...</div>
}

// ── 변화 뱃지 ──────────────────────────────────────────────
function ChangeBadge({ value, suffix = '', decimals = 2, invertColor = false }: {
  value: number; suffix?: string; decimals?: number; invertColor?: boolean
}) {
  const isPos = value > 0
  const colored = invertColor ? !isPos : isPos
  const cls = colored
    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
    : value < 0
      ? 'bg-red-500/15 text-red-400 border border-red-500/25'
      : 'bg-gray-700 text-gray-500 border border-gray-600'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${cls}`}>
      {value >= 0 ? '+' : ''}{value.toFixed(decimals)}{suffix}
    </span>
  )
}

// ── ON RRP / SOFR 패널 ────────────────────────────────────
function FlowPanel({ series, label, unit, desc, color, invertChangeColor = false }: {
  series: FlowSeries | null
  label: string
  unit: string
  desc: string
  color: string
  invertChangeColor?: boolean
}) {
  if (!series) return (
    <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col gap-2">
      <span className="text-xs font-semibold text-gray-400">{label}</span>
      <p className="text-xs text-gray-600 py-4 text-center">데이터 없음</p>
    </div>
  )

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">{label}</span>
        <span className="text-xs text-gray-600">{series.date}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-bold text-white tabular-nums">
          {series.current.toLocaleString('en-US', { maximumFractionDigits: 2 })}{unit}
        </p>
        <ChangeBadge value={series.change1d} suffix={unit} decimals={unit === '%' ? 3 : 1} invertColor={invertChangeColor} />
      </div>
      <MiniSparkline data={series.history.map(p => p.value)} color={color} />
      <p className="text-xs text-gray-600">{desc}</p>
    </div>
  )
}


// ── 메인 페이지 ───────────────────────────────────────────
export default function LiquidityPage() {
  const [yields,    setYields]    = useState<YieldsAPIData | null>(null)
  const [comms,     setComms]     = useState<CommoditiesAPIData | null>(null)
  const [mmfTips,   setMmfTips]   = useState<MmfTipsData | null>(null)
  const [liqFlow,   setLiqFlow]   = useState<LiquidityFlowData | null>(null)
  const [inflation, setInflation] = useState<InflationData | null>(null)

  const [yLoading,    setYLoading]    = useState(true)
  const [cLoading,    setCLoading]    = useState(true)
  const [mmfLoading,  setMmfLoading]  = useState(true)
  const [flowLoading, setFlowLoading] = useState(true)
  const [inflLoading, setInflLoading] = useState(true)

  useEffect(() => {
    // loadAll 은 useEffect 내부에 정의 — 안정적인 클로저 보장
    const loadAll = async () => {
      setYLoading(true); setCLoading(true); setMmfLoading(true)
      setFlowLoading(true); setInflLoading(true)

      const safeJson = (r: Response) => r.ok ? r.json() : null

      await Promise.allSettled([
        fetch('/api/yields')
          .then(safeJson).then(d => d && setYields(d)).finally(() => setYLoading(false)),
        fetch('/api/commodities')
          .then(safeJson).then(d => d && setComms(d)).finally(() => setCLoading(false)),
        fetch('/api/mmf-tips')
          .then(safeJson).then(d => d && setMmfTips(d)).finally(() => setMmfLoading(false)),
        fetch('/api/liquidity-flow')
          .then(safeJson).then(d => d && setLiqFlow(d)).finally(() => setFlowLoading(false)),
        fetch('/api/inflation')
          .then(safeJson).then(d => d && setInflation(d)).finally(() => setInflLoading(false)),
      ])
    }

    loadAll()
    const id = setInterval(loadAll, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const timestamp = yields?.timestamp ?? comms?.timestamp ?? Date.now()
  const updateTime = new Date(timestamp).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit',
  })

  const y3m  = yields?.yields.find(y => y.label === '3M')?.value ?? 0
  const y10y = yields?.yields.find(y => y.label === '10Y')?.value ?? 0
  const spread = y10y - y3m
  const isInverted = y3m > y10y && y10y > 0

  // TIPS 10Y 기준 실질금리 레벨 신호
  const tips10y = mmfTips?.tips?.find(t => t.label === '10Y')?.value ?? null
  const tipsSignal = tips10y === null ? null
    : tips10y > 2  ? { text: '🔴 실질금리 높음 — 주식 밸류에이션 압박', cls: 'bg-red-500/10 text-red-300' }
    : tips10y > 0  ? { text: '🟡 실질금리 양호 — 중립적 환경', cls: 'bg-yellow-500/10 text-yellow-300' }
    :                { text: '🟢 실질금리 음수 — 위험자산 우호적', cls: 'bg-emerald-500/10 text-emerald-300' }

  // 인플레이션 히트맵 헤더: cells 가 있는 첫 번째 행으로부터 날짜 도출
  const inflHeaderRow = inflation?.rows.find(r => r.cells.length > 0)
  const inflHasData   = inflation?.rows.some(r => r.cells.length > 0) ?? false
  // 실제 셀 수 + 지표 레이블 열
  const inflColCount  = inflHeaderRow?.cells.length ?? 0

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-8">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">유동성 &amp; 시장</h1>
            <p className="text-xs text-gray-500 mt-0.5">국채 수익률 · 원자재 · MMF · RRP/SOFR · 인플레이션</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-600">{updateTime} 기준</span>
            <RefreshBadge />
          </div>
        </div>

        {/* ── 국채 수익률 곡선 ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-white">국채 수익률 곡선</p>
              <p className="text-xs text-gray-500 mt-0.5">미국 국채 3M · 5Y · 10Y · 30Y</p>
            </div>
            {y10y > 0 && (
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isInverted
                  ? 'text-red-400 bg-red-500/10 border border-red-500/30'
                  : 'text-green-400 bg-green-500/10 border border-green-500/30'
              }`}>
                {isInverted ? '⚠️ 역전' : '✅ 정상'}
              </div>
            )}
          </div>

          {yLoading ? <LoadingBox /> : yields ? (
            <>
              <YieldCurveChart yields={yields.yields} />
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-800">
                {yields.yields.map(y => (
                  <div key={y.label} className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-gray-500">{y.label}</span>
                    <span className="text-sm font-bold text-white tabular-nums">{y.value.toFixed(2)}%</span>
                    <span className={`text-xs tabular-nums ${
                      y.change > 0 ? 'text-red-400' : y.change < 0 ? 'text-green-400' : 'text-gray-600'
                    }`}>
                      {y.change >= 0 ? '+' : ''}{y.change.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
              {y10y > 0 && y3m > 0 && (
                <div className={`text-xs rounded-lg px-3 py-2 ${
                  isInverted ? 'bg-red-500/10 text-red-300' : 'bg-gray-800 text-gray-400'
                }`}>
                  <span className="font-semibold">10Y − 3M 스프레드: </span>
                  <span className="tabular-nums font-bold">{spread >= 0 ? '+' : ''}{spread.toFixed(2)}%</span>
                  {isInverted && (
                    <span className="ml-2">— 역전 곡선은 경기침체 선행 신호로 해석됩니다</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-600 text-center py-8">데이터 없음</p>
          )}
        </section>

        {/* ── 원자재 모멘텀 트래커 ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-white">원자재 모멘텀 트래커</p>
            <p className="text-xs text-gray-500 mt-0.5">1개월(~20 영업일) 등락률 기준 인플레이션 선행지표</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span><span className="text-red-400">■</span> +5% 이상 — 물가 상승 신호</span>
            <span><span className="text-emerald-400">■</span> 0~+5% — 완만 상승</span>
            <span><span className="text-sky-400">■</span> 마이너스 — 물가 하락 신호</span>
          </div>

          {cLoading ? <LoadingBox /> : comms ? (
            <>
              {['에너지', '귀금속', '금속', '농산물'].map(cat => {
                const items = comms.commodities.filter(c => c.category === cat)
                if (!items.length) return null
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">{cat}</p>
                    <div className="flex flex-col divide-y divide-gray-800">
                      {items
                        .sort((a, b) => b.monthChange - a.monthChange)
                        .map(item => <CommodityBar key={item.symbol} item={item} />)
                      }
                    </div>
                  </div>
                )
              })}
              {(() => {
                const gold   = comms.commodities.find(c => c.symbol === 'GC=F')?.monthChange ?? 0
                const copper = comms.commodities.find(c => c.symbol === 'HG=F')?.monthChange ?? 0
                if (gold > 3 && copper < -3) return (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-300">
                    ⚠️ <span className="font-semibold">경기침체 경고 시그널:</span> 금↑ + 구리↓ 동시 발생 — 안전자산 선호, 실물 수요 위축
                  </div>
                )
                return null
              })()}
            </>
          ) : (
            <p className="text-xs text-gray-600 text-center py-8">데이터 없음</p>
          )}
        </section>

        {/* ── MMF 자금흐름 + TIPS 실질금리 ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-semibold text-white">MMF 자금흐름 · TIPS 실질금리</p>
              <p className="text-xs text-gray-500 mt-0.5">머니마켓펀드 잔액(안전선호 지표) + 물가연동국채 실질수익률</p>
            </div>
            <InfoPopup {...INFO.mmfTips} />
          </div>

          {mmfLoading ? <LoadingBox /> : mmfTips ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MMF 패널 - dummy comment to preserve structure */}
              <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">MMF 총 자산</span>
                  <span className="text-xs text-gray-600">{mmfTips.mmf?.date ?? '—'}</span>
                </div>
                {mmfTips.mmf ? (
                  <>
                    <div>
                      <p className="text-2xl font-bold text-white tabular-nums">
                        ${(mmfTips.mmf.current / 1000).toFixed(2)}<span className="text-base text-gray-400">조</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{mmfTips.mmf.current.toLocaleString()} 십억 USD</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-gray-600">1주 변화</p>
                        <p className={`text-sm font-semibold tabular-nums ${mmfTips.mmf.change1w >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {mmfTips.mmf.change1w >= 0 ? '+' : ''}{mmfTips.mmf.change1w.toFixed(0)}B
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">4주 변화</p>
                        <p className={`text-sm font-semibold tabular-nums ${mmfTips.mmf.change4w >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {mmfTips.mmf.change4w >= 0 ? '+' : ''}{mmfTips.mmf.change4w.toFixed(0)}B
                        </p>
                      </div>
                    </div>
                    <MiniSparkline data={mmfTips.mmf.history.map(p => p.value)} color="#818cf8" />
                    <p className="text-xs text-gray-600">↑ 증가 = 안전자산 선호 강화, 위험선호 약화 신호</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-600 text-center py-4">데이터 없음</p>
                )}
              </div>

              {/* TIPS 패널 */}
              <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col gap-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TIPS 실질금리</span>
                {mmfTips.tips.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-3">
                      {mmfTips.tips.map(t => (
                        <div key={t.label} className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">{t.label} 실질금리</p>
                            <p className="text-xl font-bold text-white tabular-nums">{t.value.toFixed(2)}%</p>
                            <p className="text-xs text-gray-600">{t.date}</p>
                          </div>
                          <ChangeBadge value={t.change} suffix="%" decimals={3} />
                        </div>
                      ))}
                    </div>
                    {tipsSignal && (
                      <div className={`text-xs rounded-lg px-2.5 py-1.5 ${tipsSignal.cls}`}>
                        {tipsSignal.text}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-600 text-center py-4">데이터 없음</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-8">데이터 없음</p>
          )}
        </section>

        {/* ── ON RRP + SOFR 유동성 흐름 ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-semibold text-white">ON RRP · SOFR 유동성 흐름</p>
              <p className="text-xs text-gray-500 mt-0.5">연준 역레포 잔액 + 단기 담보금리 — 최근 60 거래일</p>
            </div>
            <InfoPopup {...INFO.rrpSofr} />
          </div>

          {flowLoading ? <LoadingBox /> : liqFlow ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FlowPanel
                series={liqFlow.rrp}
                label="ON RRP 잔액"
                unit="B"
                desc="↓ 감소 = 은행 시스템 유동성 공급 증가"
                color="#f472b6"
                invertChangeColor
              />
              <FlowPanel
                series={liqFlow.sofr}
                label="SOFR"
                unit="%"
                desc="단기 담보부 자금 조달 비용 기준금리"
                color="#fb923c"
              />
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-8">데이터 없음</p>
          )}
        </section>

        {/* ── 인플레이션 히트맵 ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-semibold text-white">인플레이션 히트맵</p>
              <p className="text-xs text-gray-500 mt-0.5">CPI · PPI · PCE · 임금 전년동기비(YoY %) — 최근 6개월</p>
            </div>
            <InfoPopup {...INFO.inflation} />
          </div>

          {/* 범례 */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200">0% 미만</span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">0~1.5%</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-200">1.5~2.5% ✓목표</span>
            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">2.5~3.5%</span>
            <span className="px-2 py-0.5 rounded bg-orange-500/25 text-orange-300">3.5~5%</span>
            <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-300">5%+</span>
          </div>

          {inflLoading ? <LoadingBox /> : (inflation && inflHasData) ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs border-collapse min-w-[380px]">
                <thead>
                  <tr>
                    <th className="text-left text-gray-600 font-normal pb-2 pr-2 w-28">지표</th>
                    {/* cells 있는 첫 행으로부터 날짜 헤더 생성 */}
                    {inflHeaderRow?.cells.map((c, ci, arr) => (
                      <th key={c.date}
                        className={`text-center font-normal pb-2 px-1 ${ci === arr.length - 1 ? 'text-gray-300 font-semibold' : 'text-gray-600'}`}>
                        {formatMonth(c.date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inflation.rows.map((row: InflationRow) => (
                    <tr key={row.id} className="border-t border-gray-800/50">
                      <td className="py-2 pr-2 text-gray-400 whitespace-nowrap">
                        <span className="mr-1">{row.emoji}</span>{row.label}
                      </td>
                      {row.cells.length > 0 ? row.cells.map((c, ci, arr) => {
                        const isLatest = ci === arr.length - 1
                        return (
                          <td key={c.date} className="py-1.5 px-1 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded tabular-nums ${yoyColor(c.yoy)} ${isLatest ? 'font-bold' : 'font-normal'}`}>
                              {c.yoy.toFixed(1)}
                              {isLatest && row.trend === 'up'   && '↑'}
                              {isLatest && row.trend === 'down' && '↓'}
                            </span>
                          </td>
                        )
                      }) : (
                        // 실제 열 수에 맞춰 colSpan 동적 계산
                        <td colSpan={inflColCount} className="py-2 text-center text-gray-700">—</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-8">데이터 없음</p>
          )}
        </section>

      </div>
    </div>
  )
}
