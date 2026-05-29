'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { GDPNowData }           from '@/app/api/gdpnow/route'
import type { EmploymentDominoData, DominoStage } from '@/app/api/employment-domino/route'
import type { ConsumerHealthData, HealthIndicator } from '@/app/api/consumer-health/route'
import RefreshBadge from '@/components/RefreshBadge'

// ═══════════════════════════════════════════════════════════
// ── 공통 헬퍼 컴포넌트 ────────────────────────────────────
// ═══════════════════════════════════════════════════════════

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

function ChangeBadge({ value, suffix = '', decimals = 1, invertColor = false }: {
  value: number; suffix?: string; decimals?: number; invertColor?: boolean
}) {
  const isPos    = value > 0
  const colored  = invertColor ? !isPos : isPos
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

function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' | 'unknown' }) {
  const cls = {
    green:   'bg-emerald-400 shadow-emerald-400/50',
    yellow:  'bg-yellow-400 shadow-yellow-400/50',
    red:     'bg-red-400 shadow-red-400/50',
    unknown: 'bg-gray-600',
  }[status]
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${cls}`} />
}

function LoadingBox() {
  return (
    <div className="h-40 flex items-center justify-center text-gray-600 text-sm animate-pulse">
      로딩 중...
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 정보 팝업 ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
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
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        className="bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div
        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}
        className="w-80 max-w-[calc(100vw-32px)] max-h-[75vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-gray-800 shrink-0">
          <p className="text-sm font-bold text-white leading-snug">{title}</p>
          <button onClick={() => setOpen(false)}
            className="shrink-0 text-gray-500 hover:text-white text-xl leading-none mt-0.5">×</button>
        </div>
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

// ═══════════════════════════════════════════════════════════
// ── 팝업 내용 ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
const INFO = {
  gdpnow: {
    title: 'GDPNow 실시간 GDP 추정을 왜 봐야 할까?',
    summary: 'GDP는 분기 끝나고 몇 달 뒤에야 공식 발표되지만, Atlanta Fed의 GDPNow는 지금 이 순간의 성장률을 실시간으로 추정해줘요. 주 2~3회 업데이트되며 "경기가 지금 어디쯤인지" 가장 빠르게 알 수 있는 지표예요.',
    items: [
      {
        label: 'GDPNow란?',
        text: 'Atlanta Fed가 매주 발표하는 당분기 실질 GDP 성장률 추정치예요. 소매판매, 공장 주문, 고용, 주택 등 수십 개 경제지표를 실시간으로 반영해요. "공식 GDP 예측"이 아닌 모델 기반 추정이지만 실제 GDP와 상관관계가 매우 높아요.',
      },
      {
        label: '색상으로 읽기',
        text: '초록(>2.5%) = 확장 국면, 양호. 노랑(1~2.5%) = 완만한 성장, 주의. 빨강(<0%) = 마이너스 성장 위험, 경기침체 신호 확인 필요. 2024년처럼 2%대에서 안정적이면 연착륙 시나리오.',
      },
      {
        label: '한계와 주의사항',
        text: '분기 초에는 데이터가 적어 변동이 크고, 분기 말로 갈수록 정확해져요. 예측치가 -2%에서 +3%로 급변하는 경우도 있으니 단기 변동보다 추세를 봐야 해요. Atlanta Fed 홈페이지에서 과거 예측 정확도를 확인할 수 있어요.',
      },
      {
        label: '주식시장과의 연관성',
        text: '연속 2분기 마이너스 = 기술적 경기침체. GDPNow가 2분기 연속 마이너스 방향이면 경기침체 우려로 주식 밸류에이션 할인 압력이 커져요. 반대로 예상보다 높은 수치가 나오면 어닝 상승 기대감으로 증시에 긍정적이에요.',
      },
    ],
  },
  employmentDomino: {
    title: '고용 5단계 도미노를 왜 봐야 할까?',
    summary: '기업이 경기 둔화를 감지하는 순간부터 실업률이 오르기까지 평균 6~18개월의 시차가 있어요. 이 5개 지표를 순서대로 모니터링하면 "고용 붕괴가 어느 단계인지" 조기에 파악할 수 있어요.',
    items: [
      {
        label: 'Stage 1 · 구인건수 (JOLTS)',
        text: '기업이 가장 먼저 반응해요. 불확실성이 커지면 신규 채용 공고를 줄이는 게 정리해고보다 쉽거든요. 7.5M 이하로 내려오면 노동 수요 약화 신호예요.',
      },
      {
        label: 'Stage 2 · 임시직 고용 (TEMPHELPS)',
        text: 'JOLTS보다 1~3개월 앞서 NFP를 예측해요. 경기 둔화 시 기업은 정규직보다 임시직을 먼저 줄여요. YoY -5% 이하 = 레드 경보.',
      },
      {
        label: 'Stage 3 · 신규 실업수당 (ICSA)',
        text: '본격적인 해고가 시작되는 신호예요. 주간 26만 건을 초과하거나 YoY +15% 이상 급증하면 서킷브레이커 수준이에요.',
      },
      {
        label: 'Stage 4 · NFP 비농업 고용',
        text: '가장 유명한 고용 지표예요. 15만 명 이상 꾸준히 증가하면 건전, 5만 명 미만이 수개월 지속되면 경고, 마이너스 전환 시 확실한 경기 수축 신호예요.',
      },
      {
        label: 'Stage 5 · 샴룰 (Sahm Rule)',
        text: '실업률 3개월 이동평균이 12개월 최저치보다 0.5%p 이상 높으면 경기침체 진입을 알리는 지표예요. 2007년 이후 모든 경기침체에서 정확히 작동했어요. 0.5 돌파 = 공식 경고.',
      },
    ],
  },
  consumerHealth: {
    title: '소비자 건강 3단계 구조를 왜 봐야 할까?',
    summary: '미국 GDP의 70%가 소비예요. 소비자가 건강한지 확인하려면 "마음→지갑→행동" 순으로 봐야 해요. 심리만 좋고 저축이 바닥나면 곧 소비 절벽이 옵니다.',
    items: [
      {
        label: 'Stage 1 · 심리 (U-Mich 소비자심리)',
        text: '소비자가 경제를 어떻게 느끼는지를 측정해요. 100이 기준, 80 이상은 낙관적, 65 미만은 비관적이에요. 주가와 방향이 비슷하게 움직이지만, 주가보다 실제 소비 변화를 3~6개월 앞서 보여줘요.',
      },
      {
        label: 'Stage 2a · 체력 — 저축률 (PSAVERT)',
        text: '가처분소득 대비 저축 비율이에요. 6% 이상 = 재정적 여유, 3~6% = 경계, 3% 미만 = 빚으로 소비하는 위험 구간이에요. 2022~2023년 미국 저축률이 팬데믹 부양금 소진으로 2~3%대로 급락했어요.',
      },
      {
        label: 'Stage 2b · 체력 — 신용카드 연체율 (DRCCLACBS)',
        text: '미국 상업은행의 신용카드 연체율(90일 이상)이에요. 2.5% 이상 = 경계, 3.5% 이상 = 위험 신호예요. 저축률이 낮고 연체율이 높으면 소비자가 빚으로 연명하는 상태로, 소비 절벽 위험이 커요.',
      },
      {
        label: 'Stage 3 · 행동 — 소매판매 YoY',
        text: '실제 지갑을 여는지 확인하는 최종 단계예요. 명목 YoY 기준 4% 이상 = 왕성한 소비, 0~4% = 완만, 0% 미만 = 소비 위축이에요. 인플레를 감안하면 실질 소비는 이보다 낮다는 점을 기억하세요.',
      },
      {
        label: '⚠️ 가짜 호황 경고란?',
        text: '심리는 좋은데(UMich > 80) 저축률은 바닥(< 3%)이고 연체율은 치솟는(> 3.5%) 상태예요. 소비자가 "지금은 괜찮다"고 느끼면서 빚으로 소비하는 구간이에요. 경기가 좋아 보이지만 내부에서 균열이 진행 중이라는 신호예요. 역사적으로 이 신호 후 6~12개월 내 소비 급감이 발생했어요.',
      },
    ],
  },
}

// ═══════════════════════════════════════════════════════════
// ── GDPNow 색상 ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function gdpColor(v: number): string {
  if (v >= 2.5) return 'text-emerald-400'
  if (v >= 1.0) return 'text-yellow-400'
  if (v >= 0)   return 'text-orange-400'
  return 'text-red-400'
}

function gdpBgColor(v: number): string {
  if (v >= 2.5) return 'border-emerald-500/30 bg-emerald-500/5'
  if (v >= 1.0) return 'border-yellow-500/30 bg-yellow-500/5'
  if (v >= 0)   return 'border-orange-500/30 bg-orange-500/5'
  return 'border-red-500/30 bg-red-500/5'
}

// ═══════════════════════════════════════════════════════════
// ── 도미노 카드 ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function DominoCard({ stage }: { stage: DominoStage }) {
  const sparkColor = stage.status === 'red' ? '#f87171' : stage.status === 'yellow' ? '#facc15' : '#34d399'
  const invertChange = stage.id === 'icsa' || stage.id === 'sahm'  // lower = better for these

  const displayVal = stage.current !== null
    ? stage.id === 'sahm'
      ? stage.current.toFixed(2)
      : Math.abs(stage.current) >= 1000
        ? (stage.current / 1000).toFixed(1) + 'K'
        : stage.current.toFixed(1)
    : '—'

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex flex-col gap-2 min-w-0">
      {/* Stage badge + status */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
          S{stage.stage}
        </span>
        <StatusDot status={stage.status} />
      </div>
      {/* Label */}
      <div>
        <p className="text-xs text-gray-400 leading-tight">{stage.emoji} {stage.label}</p>
        <p className="text-[10px] text-gray-600 leading-tight mt-0.5">{stage.note}</p>
      </div>
      {/* Value */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xl font-bold tabular-nums text-white leading-none">
          {displayVal}
        </span>
        {stage.change !== null && (
          <ChangeBadge value={stage.change} invertColor={invertChange}
            decimals={stage.id === 'sahm' ? 2 : 1} />
        )}
      </div>
      <p className="text-[10px] text-gray-600">{stage.unit}</p>
      {/* Sparkline */}
      <MiniSparkline data={stage.history.map(p => p.value)} color={sparkColor} />
      {stage.date && (
        <p className="text-[10px] text-gray-600 tabular-nums">{stage.date.slice(0, 7)}</p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 소비자 건강 카드 ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function HealthCard({ ind }: { ind: HealthIndicator }) {
  const sparkColor = ind.status === 'red' ? '#f87171' : ind.status === 'yellow' ? '#facc15' : '#34d399'
  const invertChange = ind.id === 'saving'      // low saving = bad, so decrease = red
  const invertBadge  = ind.id === 'delinquency' // high delinquency = bad

  const displayVal = ind.current !== null
    ? ind.id === 'retail' || ind.id === 'delinquency' || ind.id === 'saving'
      ? `${ind.current.toFixed(1)}%`
      : ind.current.toFixed(1)
    : '—'

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{ind.emoji} {ind.label}</p>
        <StatusDot status={ind.status} />
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold tabular-nums text-white">{displayVal}</span>
        {ind.change !== null && ind.id !== 'retail' && (
          <ChangeBadge value={ind.change} suffix={ind.unit === '%' ? '%p' : ''}
            invertColor={invertBadge && !invertChange || (!invertBadge && invertChange)} />
        )}
      </div>
      <MiniSparkline data={ind.history.map(p => p.value)} color={sparkColor} />
      {ind.date && (
        <p className="text-[10px] text-gray-600 tabular-nums">{ind.date.slice(0, 7)}</p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 메인 페이지 ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function RealEconomyPage() {
  const [gdpnow,     setGdpnow]     = useState<GDPNowData | null>(null)
  const [domino,     setDomino]     = useState<EmploymentDominoData | null>(null)
  const [consumer,   setConsumer]   = useState<ConsumerHealthData | null>(null)
  const [gdpLoading, setGdpLoading] = useState(true)
  const [domLoading, setDomLoading] = useState(true)
  const [conLoading, setConLoading] = useState(true)

  useEffect(() => {
    const loadAll = async () => {
      const safeJson = (r: Response) => r.ok ? r.json() : null
      await Promise.allSettled([
        fetch('/api/gdpnow')
          .then(safeJson)
          .then(d => d && setGdpnow(d))
          .finally(() => setGdpLoading(false)),
        fetch('/api/employment-domino')
          .then(safeJson)
          .then(d => d && setDomino(d))
          .finally(() => setDomLoading(false)),
        fetch('/api/consumer-health')
          .then(safeJson)
          .then(d => d && setConsumer(d))
          .finally(() => setConLoading(false)),
      ])
    }

    loadAll()
    const id = setInterval(loadAll, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const stageLabels: Record<string, string> = {
    green:   '정상',
    yellow:  '경계',
    red:     '위험',
    unknown: '—',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-6 flex flex-col gap-6">

        {/* ── 헤더 ───────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏭</span>
            <h1 className="text-lg font-bold text-white">실물경제</h1>
          </div>
          <RefreshBadge />
        </div>

        {/* ══════════════════════════════════════════════════
            SECTION 1 — GDPNow
        ══════════════════════════════════════════════════ */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">
                📈 {gdpnow?.source === 'wei' ? 'WEI 주간 경기지수' : 'GDPNow 실시간 GDP 추정'}
              </span>
              <InfoPopup {...INFO.gdpnow} />
            </div>
            <span className="text-xs text-gray-500">
              {gdpnow?.source === 'wei' ? 'NY Fed (FRED)' : 'Atlanta Fed'}
            </span>
          </div>

          {/* WEI 폴백 알림 */}
          {!gdpLoading && gdpnow?.source === 'wei' && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-300">
              <span>ℹ️</span>
              <span>Atlanta Fed 접근 제한으로 NY Fed 주간 경제지수(WEI)를 대신 표시 중이에요.
                WEI도 동일한 연율 GDP 기준이며 주간 갱신돼요.
              </span>
            </div>
          )}

          {gdpLoading ? (
            <LoadingBox />
          ) : gdpnow?.current !== null && gdpnow?.current !== undefined ? (
            <div className={`rounded-xl border p-5 flex flex-col sm:flex-row items-center gap-4 ${gdpBgColor(gdpnow.current)}`}>
              {/* 큰 숫자 */}
              <div className="text-center sm:text-left">
                <p className={`text-6xl font-bold tabular-nums leading-none ${gdpColor(gdpnow.current)}`}>
                  {gdpnow.current > 0 ? '+' : ''}{gdpnow.current.toFixed(1)}
                  <span className="text-3xl">%</span>
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {gdpnow.source === 'wei' ? '연율 경제활동 지수 (WEI)' : '연율 기준 실질 GDP (SAAR)'}
                </p>
              </div>
              {/* 보조 정보 */}
              <div className="flex-1 flex flex-col gap-1 text-center sm:text-right">
                {gdpnow.quarter && (
                  <p className="text-xs text-gray-400">{gdpnow.quarter}</p>
                )}
                {gdpnow.date && (
                  <p className="text-xs text-gray-500">업데이트: {gdpnow.date}</p>
                )}
                <p className="text-xs font-semibold mt-1" style={{ color: gdpnow.current >= 2.5 ? '#34d399' : gdpnow.current >= 1 ? '#facc15' : gdpnow.current >= 0 ? '#fb923c' : '#f87171' }}>
                  {gdpnow.current >= 2.5 ? '🟢 확장 국면' : gdpnow.current >= 1 ? '🟡 완만한 성장' : gdpnow.current >= 0 ? '🟠 성장 둔화' : '🔴 마이너스 성장'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 p-5 text-center">
              <p className="text-gray-500 text-sm">데이터를 불러올 수 없습니다</p>
              <a
                href="https://www.atlantafed.org/cgi-bin/banking/fredblog/gdpnow-model-version/view/current"
                target="_blank" rel="noopener noreferrer"
                className="text-blue-400 text-xs underline mt-1 inline-block hover:text-blue-300"
              >
                Atlanta Fed GDPNow 직접 확인 →
              </a>
            </div>
          )}

          {/* 컬러 범례 */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {[
              { label: '>2.5%', color: 'bg-emerald-400', text: '확장' },
              { label: '1~2.5%', color: 'bg-yellow-400', text: '완만' },
              { label: '0~1%', color: 'bg-orange-400', text: '둔화' },
              { label: '<0%', color: 'bg-red-400', text: '수축' },
            ].map(c => (
              <span key={c.label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${c.color}`} />
                {c.label} {c.text}
              </span>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 2 — 고용 5단계 도미노
        ══════════════════════════════════════════════════ */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">🎯 고용 5단계 도미노</span>
              <InfoPopup {...INFO.employmentDomino} />
            </div>
            {domino && (
              <p className="text-xs text-gray-500 tabular-nums">
                {new Date(domino.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {domLoading ? (
            <LoadingBox />
          ) : domino ? (
            <>
              {/* 도미노 상태 요약 바 */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {domino.stages.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1 shrink-0">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border ${
                      s.status === 'green'   ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' :
                      s.status === 'yellow'  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' :
                      s.status === 'red'     ? 'border-red-500/30 bg-red-500/10 text-red-300' :
                      'border-gray-700 bg-gray-800/50 text-gray-500'
                    }`}>
                      <StatusDot status={s.status} />
                      <span>S{s.stage}</span>
                      <span className="font-semibold">{stageLabels[s.status]}</span>
                    </div>
                    {i < 4 && <span className="text-gray-700 text-xs">→</span>}
                  </div>
                ))}
              </div>

              {/* 5개 카드 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {domino.stages.map(s => (
                  <DominoCard key={s.id} stage={s} />
                ))}
              </div>

              {/* 샴룰 임계값 주석 */}
              {domino.stages[4]?.current !== null && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>샴룰 임계:</span>
                  <div className="flex-1 h-1 bg-gray-800 rounded-full relative">
                    <div
                      className={`h-full rounded-full ${
                        (domino.stages[4].current ?? 0) >= 0.5 ? 'bg-red-500' :
                        (domino.stages[4].current ?? 0) >= 0.3 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ((domino.stages[4].current ?? 0) / 1.0) * 100)}%` }}
                    />
                  </div>
                  <span className="tabular-nums w-12 text-right">
                    {domino.stages[4].current?.toFixed(2)} / 0.50
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">데이터를 불러올 수 없습니다</div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 3 — 소비자 건강 3단계
        ══════════════════════════════════════════════════ */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">🛒 소비자 건강 3단계 구조</span>
              <InfoPopup {...INFO.consumerHealth} />
            </div>
            {consumer && (
              <p className="text-xs text-gray-500 tabular-nums">
                {new Date(consumer.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {conLoading ? (
            <LoadingBox />
          ) : consumer ? (
            <>
              {/* 가짜 호황 경고 배너 */}
              {consumer.alertFakeBoom && (
                <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm font-bold text-orange-300">가짜 호황 경고</p>
                    <p className="text-xs text-orange-200/70 mt-0.5 leading-relaxed">
                      소비자 심리는 좋지만 저축률이 바닥이고 신용카드 연체율이 급등 중이에요.
                      빚으로 소비하는 불안정한 구간 — 소비 절벽이 가까울 수 있어요.
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 1 — 심리 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Stage 1</span>
                  <span className="text-xs text-gray-400">심리 (Mind)</span>
                  <StatusDot status={consumer.sentiment.status} />
                  <span className="text-xs text-gray-600">{stageLabels[consumer.sentiment.status]}</span>
                </div>
                <HealthCard ind={consumer.sentiment} />
              </div>

              {/* Connector */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-700 text-xs">↓</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Stage 2 — 체력 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Stage 2</span>
                  <span className="text-xs text-gray-400">체력 (Capacity) ⭐</span>
                  <StatusDot status={
                    consumer.saving.status === 'red' || consumer.delinquency.status === 'red' ? 'red' :
                    consumer.saving.status === 'yellow' || consumer.delinquency.status === 'yellow' ? 'yellow' :
                    consumer.saving.status === 'green' && consumer.delinquency.status === 'green' ? 'green' : 'unknown'
                  } />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <HealthCard ind={consumer.saving} />
                  <HealthCard ind={consumer.delinquency} />
                </div>
              </div>

              {/* Connector */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-700 text-xs">↓</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Stage 3 — 행동 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Stage 3</span>
                  <span className="text-xs text-gray-400">행동 (Action)</span>
                  <StatusDot status={consumer.retail.status} />
                  <span className="text-xs text-gray-600">{stageLabels[consumer.retail.status]}</span>
                </div>
                <HealthCard ind={consumer.retail} />
              </div>

              {/* 구조 해설 */}
              <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-800 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 정상 구간</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> 경계 구간</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> 위험 구간</span>
                <span className="ml-auto">Stage 2 체력 = 핵심 ⭐</span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">데이터를 불러올 수 없습니다</div>
          )}
        </section>

      </div>
    </div>
  )
}
