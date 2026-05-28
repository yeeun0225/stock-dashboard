'use client'

import { useEffect, useState } from 'react'
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
          <div>
            <p className="text-sm font-semibold text-white">MMF 자금흐름 · TIPS 실질금리</p>
            <p className="text-xs text-gray-500 mt-0.5">머니마켓펀드 잔액(안전선호 지표) + 물가연동국채 실질수익률</p>
          </div>

          {mmfLoading ? <LoadingBox /> : mmfTips ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MMF 패널 */}
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
          <div>
            <p className="text-sm font-semibold text-white">ON RRP · SOFR 유동성 흐름</p>
            <p className="text-xs text-gray-500 mt-0.5">연준 역레포 잔액 + 단기 담보금리 — 최근 60 거래일</p>
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
          <div>
            <p className="text-sm font-semibold text-white">인플레이션 히트맵</p>
            <p className="text-xs text-gray-500 mt-0.5">CPI · PPI · PCE · 임금 전년동기비(YoY %) — 최근 6개월</p>
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
