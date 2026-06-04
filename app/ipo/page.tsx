'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { IpoData, IpoItem } from '@/app/api/ipo/route'
import LoginScreen from '@/components/LoginScreen'
import { useAuth } from '@/lib/auth-client'
import { dbLoadIpoEntries, dbSaveIpoEntry, dbDeleteIpoEntry } from '@/lib/db'

// ── 날짜 유틸 ─────────────────────────────────────────────────
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(startStr: string, endStr: string): string[] {
  const out: string[] = []
  try {
    const cur = new Date(startStr + 'T00:00:00')
    const end = new Date(endStr   + 'T00:00:00')
    if (isNaN(cur.getTime()) || isNaN(end.getTime())) return out
    while (cur <= end) {
      out.push(toDateStr(cur))
      cur.setDate(cur.getDate() + 1)
    }
  } catch { /* skip */ }
  return out
}

// ── 공모 카드 ─────────────────────────────────────────────────
function IpoCard({ item, type }: { item: IpoItem; type: 'subscribe' | 'listing' }) {
  const badge = type === 'listing'
    ? <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded px-1.5 py-0.5">상장</span>
    : <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded px-1.5 py-0.5">청약</span>

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-sm font-bold text-white">{item.name}</h3>
        {badge}
        {item.market && (
          <span className="text-[10px] text-gray-500 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">
            {item.market}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {item.offeringPrice && (
          <>
            <span className="text-gray-500">공모가</span>
            <span className="text-gray-200 font-medium">{item.offeringPrice}원</span>
          </>
        )}
        {item.subscribeStart && item.subscribeEnd && (
          <>
            <span className="text-gray-500">청약기간</span>
            <span className="text-gray-200">
              {item.subscribeStart.slice(5).replace('-', '.')}
              {' ~ '}
              {item.subscribeEnd.slice(5).replace('-', '.')}
            </span>
          </>
        )}
        {item.listingDate && (
          <>
            <span className="text-gray-500">상장예정일</span>
            <span className="text-gray-200">{item.listingDate.slice(5).replace('-', '.')}</span>
          </>
        )}
        {item.securities && (
          <>
            <span className="text-gray-500">주간사</span>
            <span className="text-gray-200">{item.securities}</span>
          </>
        )}
        {item.institutionalRatio && (
          <>
            <span className="text-gray-500">기관경쟁률</span>
            <span className="text-blue-300 font-medium">{item.institutionalRatio}</span>
          </>
        )}
        {item.subscriptionRatio && (
          <>
            <span className="text-gray-500">청약경쟁률</span>
            <span className="text-blue-300 font-medium">{item.subscriptionRatio}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ── 로딩 스켈레톤 ─────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-gray-800 rounded" />
          <div className="flex gap-2">
            <div className="h-7 w-7 bg-gray-800 rounded-lg" />
            <div className="h-7 w-16 bg-gray-800 rounded-lg" />
            <div className="h-7 w-7 bg-gray-800 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-10 bg-gray-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── 내 공모주 — 타입 & 유틸 ───────────────────────────────────
// ══════════════════════════════════════════════════════════════
type MarketType = 'KOSPI' | 'KOSDAQ' | 'KONEX' | ''

interface MyIpoEntry {
  id:              string
  name:            string
  market:          MarketType
  subscribeDate:   string    // YYYY-MM-DD (월별 그루핑 기준)
  offeringPrice:   number    // 공모가 (원)
  allocatedShares: number    // 배정주수
  exitPrice:       number    // 상장가 or 매도가 (0 = 미입력)
}

interface IpoFormState {
  name: string; market: MarketType
  subscribeDate: string; offeringPrice: string
  allocatedShares: string; exitPrice: string
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLbl(key: string): string {
  const [y, m] = key.split('-')
  return `${y}년 ${parseInt(m)}월`
}

function calcEntryPnl(e: MyIpoEntry) {
  const invested = e.offeringPrice * e.allocatedShares
  if (!e.exitPrice || !invested) return { invested, profit: null, rate: null }
  const profit = (e.exitPrice - e.offeringPrice) * e.allocatedShares
  const rate   = (e.exitPrice / e.offeringPrice - 1) * 100
  return { invested, profit, rate }
}

function fmtKRW(n: number, sign = false): string {
  const pfx = sign && n > 0 ? '+' : ''
  const abs = Math.abs(n)
  if (abs >= 100_000_000) return `${pfx}${(n / 100_000_000).toFixed(2)}억`
  if (abs >= 10_000)      return `${pfx}${(n / 10_000).toFixed(1)}만`
  return `${pfx}${n.toLocaleString()}`
}

// ── 폼 모달 (바텀시트) ────────────────────────────────────────
function MyIpoFormModal({
  initial, onSave, onClose,
}: {
  initial: IpoFormState
  onSave:  (f: IpoFormState) => void | Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<IpoFormState>(initial)
  const upd = (k: keyof IpoFormState) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const offer   = parseFloat(form.offeringPrice)   || 0
  const shares  = parseFloat(form.allocatedShares) || 0
  const exit    = parseFloat(form.exitPrice)        || 0
  const invested = offer * shares
  const profit   = exit && invested ? (exit - offer) * shares : null
  const rate     = exit && offer    ? (exit / offer - 1) * 100 : null
  const valid    = form.name.trim() && offer > 0 && shares > 0 && form.subscribeDate

  const cls = 'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 w-full'

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto bg-gray-900 border-t border-gray-700 rounded-t-2xl px-5 pt-5 pb-8 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {initial.name ? '참여 내역 수정' : '참여 내역 추가'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex flex-col gap-3">
          {/* 종목명 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">종목명 *</label>
            <input value={form.name} onChange={upd('name')} placeholder="예: 에이비엘바이오" className={cls} />
          </div>

          {/* 시장 + 청약일 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">시장</label>
              <select value={form.market} onChange={upd('market')} className={cls}>
                <option value="">미선택</option>
                <option value="KOSPI">KOSPI</option>
                <option value="KOSDAQ">KOSDAQ</option>
                <option value="KONEX">KONEX</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">청약일 *</label>
              <input type="date" value={form.subscribeDate} onChange={upd('subscribeDate')} className={cls} />
            </div>
          </div>

          {/* 공모가 + 배정주수 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">공모가 (원) *</label>
              <input type="number" value={form.offeringPrice} onChange={upd('offeringPrice')} placeholder="50000" className={cls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">배정주수 (주) *</label>
              <input type="number" value={form.allocatedShares} onChange={upd('allocatedShares')} placeholder="10" className={cls} />
            </div>
          </div>

          {/* 상장가·매도가 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              상장가 / 매도가 (원)
              <span className="text-gray-600 ml-1">— 수익률 계산, 선택</span>
            </label>
            <input type="number" value={form.exitPrice} onChange={upd('exitPrice')} placeholder="상장 후 입력" className={cls} />
          </div>

          {/* 수익률 미리보기 */}
          {invested > 0 && (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 flex flex-col gap-1.5">
              <p className="text-[11px] font-medium text-gray-500">수익률 계산기</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">투자원금</span>
                <span className="text-gray-200 font-medium">{fmtKRW(invested)}원</span>
              </div>
              {profit !== null && rate !== null ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">수익금</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      {fmtKRW(profit, true)}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">수익률</span>
                    <span className={`text-base font-extrabold ${rate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      {rate >= 0 ? '+' : ''}{rate.toFixed(2)}%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-gray-600 text-center py-0.5">상장가 입력 시 수익률 계산</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            취소
          </button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            className="flex-[2] text-sm py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </div>
      </div>
    </>
  )
}

// ── 항목 카드 ─────────────────────────────────────────────────
function MyIpoEntryCard({
  entry, onEdit, onDelete,
}: {
  entry:    MyIpoEntry
  onEdit:   () => void
  onDelete: () => void
}) {
  const { invested, profit, rate } = calcEntryPnl(entry)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white">{entry.name}</span>
          {entry.market && (
            <span className="text-[10px] text-gray-500 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">
              {entry.market}
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="text-[11px] text-gray-500 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-2 py-0.5 transition-colors">
            수정
          </button>
          <button onClick={onDelete} className="text-[11px] text-gray-500 hover:text-red-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-2 py-0.5 transition-colors">
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-gray-500">청약일</span>
        <span className="text-gray-300">{entry.subscribeDate.slice(5).replace('-', '.')}</span>
        <span className="text-gray-500">공모가 × 배정주수</span>
        <span className="text-gray-300">
          {entry.offeringPrice.toLocaleString()}원 × {entry.allocatedShares.toLocaleString()}주
        </span>
        <span className="text-gray-500">투자원금</span>
        <span className="text-gray-200 font-medium">{fmtKRW(invested)}원</span>
        {entry.exitPrice > 0 && (
          <>
            <span className="text-gray-500">상장·매도가</span>
            <span className="text-gray-300">{entry.exitPrice.toLocaleString()}원</span>
          </>
        )}
      </div>

      {profit !== null && rate !== null ? (
        <div className={[
          'flex items-center justify-between rounded-lg px-3 py-2',
          profit >= 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-500/10 border border-blue-500/20',
        ].join(' ')}>
          <span className={`text-xs ${profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
            {fmtKRW(profit, true)}원
          </span>
          <span className={`text-sm font-bold ${profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
            {rate >= 0 ? '+' : ''}{rate.toFixed(2)}%
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-gray-600 text-center">상장가 입력 시 수익률 표시</p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── 내 공모주 탭 ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
function MyIpoTab() {
  const { user, loading: authLoading, signOut } = useAuth()

  const [entries,   setEntries]   = useState<MyIpoEntry[]>([])
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)

  // Supabase 로드
  useEffect(() => {
    if (!user?.id) return
    dbLoadIpoEntries(user.id)
      .then(rows => setEntries(rows.map(r => ({ ...r, market: r.market as MarketType }))))
      .catch(() => {})
  }, [user?.id])

  const monthEntries = useMemo(() =>
    entries
      .filter(e => e.subscribeDate.startsWith(viewMonth))
      .sort((a, b) => b.subscribeDate.localeCompare(a.subscribeDate)),
    [entries, viewMonth],
  )

  const summary = useMemo(() => {
    const w = monthEntries.filter(e => e.exitPrice > 0)
    const invested = w.reduce((s, e) => s + e.offeringPrice * e.allocatedShares, 0)
    const profit   = w.reduce((s, e) => s + (e.exitPrice - e.offeringPrice) * e.allocatedShares, 0)
    return {
      count:    monthEntries.length,
      withExit: w.length,
      invested,
      profit,
      rate: invested > 0 ? profit / invested * 100 : null,
    }
  }, [monthEntries])

  const defaultDate = useMemo(() => {
    const n = new Date()
    const cur = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
    return viewMonth === cur
      ? toDateStr(n)
      : `${viewMonth}-01`
  }, [viewMonth])

  const editEntry = editId ? entries.find(e => e.id === editId) : null

  const formInitial: IpoFormState = editEntry ? {
    name:            editEntry.name,
    market:          editEntry.market,
    subscribeDate:   editEntry.subscribeDate,
    offeringPrice:   String(editEntry.offeringPrice),
    allocatedShares: String(editEntry.allocatedShares),
    exitPrice:       editEntry.exitPrice > 0 ? String(editEntry.exitPrice) : '',
  } : {
    name: '', market: 'KOSDAQ', subscribeDate: defaultDate,
    offeringPrice: '', allocatedShares: '', exitPrice: '',
  }

  const handleSave = useCallback(async (form: IpoFormState) => {
    const entry: MyIpoEntry = {
      id:              editId ?? `ipo-${Date.now()}`,
      name:            form.name.trim(),
      market:          form.market,
      subscribeDate:   form.subscribeDate,
      offeringPrice:   parseFloat(form.offeringPrice)   || 0,
      allocatedShares: parseFloat(form.allocatedShares) || 0,
      exitPrice:       parseFloat(form.exitPrice)        || 0,
    }
    // 수정 시 해당 월로 이동
    if (editId) setViewMonth(entry.subscribeDate.slice(0, 7))
    setEntries(prev =>
      editId ? prev.map(e => e.id === editId ? entry : e) : [entry, ...prev]
    )
    if (user?.id) await dbSaveIpoEntry(user.id, entry)
    setShowForm(false)
    setEditId(null)
  }, [editId, user?.id])

  const handleEdit   = (id: string) => { setEditId(id); setShowForm(true) }
  const handleDelete = async (id: string) => {
    if (!window.confirm('이 참여 내역을 삭제할까요?')) return
    if (user?.id) await dbDeleteIpoEntry(user.id, id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }
  const handleClose = () => { setShowForm(false); setEditId(null) }
  const handleAdd   = () => { setEditId(null); setShowForm(true) }

  if (authLoading) return (
    <div className="flex items-center justify-center py-16">
      <p className="text-gray-500 text-sm animate-pulse">불러오는 중...</p>
    </div>
  )
  if (!user) return <LoginScreen fullPage={false} />

  return (
    <div className="flex flex-col gap-4">

      {/* 월 네비게이션 + 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMonth(m => shiftMonth(m, -1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >‹</button>
          <span className="text-sm font-bold text-gray-100 px-2 min-w-[90px] text-center">
            {monthLbl(viewMonth)}
          </span>
          <button
            onClick={() => setViewMonth(m => shiftMonth(m, +1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >›</button>
        </div>
        <button
          onClick={handleAdd}
          className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg px-3 py-1.5 transition-colors"
        >+ 참여 추가</button>
      </div>

      {/* 월 요약 카드 */}
      {summary.count > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-medium text-gray-500">{monthLbl(viewMonth)} 요약</span>
            <span className="text-xs text-gray-600">{summary.count}건 참여</span>
          </div>
          {summary.withExit > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-gray-500">총 투자원금</span>
              <span className="text-gray-200 font-medium">{fmtKRW(summary.invested)}원</span>
              <span className="text-gray-500">총 수익</span>
              <span className={`font-bold ${summary.profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {fmtKRW(summary.profit, true)}원
              </span>
              {summary.rate !== null && (
                <>
                  <span className="text-gray-500">평균 수익률</span>
                  <span className={`font-bold ${summary.rate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {summary.rate >= 0 ? '+' : ''}{summary.rate.toFixed(2)}%
                  </span>
                </>
              )}
              {summary.withExit < summary.count && (
                <>
                  <span className="text-gray-500">수익률 미산정</span>
                  <span className="text-gray-600">{summary.count - summary.withExit}건 (상장가 미입력)</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600">상장가를 입력하면 수익률이 계산돼요</p>
          )}
        </div>
      )}

      {/* 항목 목록 */}
      {monthEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-3xl">📋</span>
          <p className="text-sm text-gray-500">이 달의 참여 내역이 없어요</p>
          <button onClick={handleAdd} className="text-xs text-blue-400 hover:text-blue-300 underline">
            + 참여 내역 추가하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {monthEntries.map(entry => (
            <MyIpoEntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => handleEdit(entry.id)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      {/* 폼 모달 */}
      {showForm && (
        <MyIpoFormModal
          initial={formInitial}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── 메인 페이지 ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function IpoPage() {
  const [data,    setData]    = useState<IpoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [subTab,  setSubTab]  = useState<'calendar' | 'mine'>('calendar')

  const today    = useMemo(() => toDateStr(new Date()), [])
  const todayObj = useMemo(() => new Date(today + 'T00:00:00'), [today])

  const [viewYear,  setViewYear]  = useState(todayObj.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayObj.getMonth())
  const [selected,  setSelected]  = useState<string | null>(today)

  const load = useCallback(async () => {
    setError(false)
    try {
      const res = await fetch('/api/ipo')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── 날짜별 이벤트 맵 ──────────────────────────────────────
  const eventMap = useMemo(() => {
    const map: Record<string, { subscribe: IpoItem[]; listing: IpoItem[] }> = {}
    if (!data) return map
    for (const item of data.items) {
      if (item.subscribeStart && item.subscribeEnd) {
        for (const d of daysBetween(item.subscribeStart, item.subscribeEnd)) {
          if (!map[d]) map[d] = { subscribe: [], listing: [] }
          map[d].subscribe.push(item)
        }
      }
      if (item.listingDate) {
        if (!map[item.listingDate]) map[item.listingDate] = { subscribe: [], listing: [] }
        map[item.listingDate].listing.push(item)
      }
    }
    return map
  }, [data])

  const selectedEvents = selected ? (eventMap[selected] ?? { subscribe: [], listing: [] }) : null

  // ── 캘린더 계산 ───────────────────────────────────────────
  const firstDayOfMonth = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1)
    return (d.getDay() + 6) % 7  // Mon=0, Sun=6
  }, [viewYear, viewMonth])

  const daysInMonth = useMemo(
    () => new Date(viewYear, viewMonth + 1, 0).getDate(),
    [viewYear, viewMonth],
  )

  const cells = useMemo(() => {
    const arr: (number | null)[] = []
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [firstDayOfMonth, daysInMonth])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const timeLabel = data
    ? new Date(data.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null

  const DOW = ['월', '화', '수', '목', '금', '토', '일']

  const totalSelected = (selectedEvents?.subscribe.length ?? 0) + (selectedEvents?.listing.length ?? 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-4">

        {/* ── 헤더 ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <h1 className="text-lg font-bold">공모주</h1>
            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">네이버 증권</span>
          </div>
          <div className="flex items-center gap-2">
            {timeLabel && <span className="text-xs text-gray-600">{timeLabel} 기준</span>}
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? '로딩 중…' : '↻ 새로고침'}
            </button>
          </div>
        </div>

        {/* ── 서브탭 ────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {(['calendar', 'mine'] as const).map((tab) => {
            const label = tab === 'calendar' ? '공모캘린더' : '내 공모주'
            const active = subTab === tab
            return (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={[
                  'flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>

        {subTab === 'mine' ? <MyIpoTab /> : (
          <>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
            데이터를 불러오지 못했어요.
            <button onClick={load} className="ml-2 underline hover:text-red-300">재시도</button>
          </div>
        )}

        {loading ? <Skeleton /> : (
          <>
            {/* ── 캘린더 ─────────────────────────────────── */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
              {/* 월 네비게이션 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-100">
                  {viewYear}년 {viewMonth + 1}월
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >‹</button>
                  <button
                    onClick={() => { setViewYear(todayObj.getFullYear()); setViewMonth(todayObj.getMonth()) }}
                    className="text-[11px] text-gray-500 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors"
                  >오늘</button>
                  <button
                    onClick={nextMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >›</button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-1">
                {DOW.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center text-[11px] font-medium py-1 ${
                      i === 5 ? 'text-blue-400' : i === 6 ? 'text-red-400' : 'text-gray-500'
                    }`}
                  >{d}</div>
                ))}
              </div>

              {/* 날짜 셀 */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, idx) => {
                  if (day === null) return <div key={`e-${idx}`} />

                  const colIdx  = idx % 7
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const ev      = eventMap[dateStr]
                  const hasSub  = (ev?.subscribe.length ?? 0) > 0
                  const hasLst  = (ev?.listing.length  ?? 0) > 0
                  const isToday = dateStr === today
                  const isSel   = dateStr === selected

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelected(isSel ? null : dateStr)}
                      className={[
                        'relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg min-h-[44px] transition-colors',
                        isSel  ? 'bg-blue-600 text-white'
                               : isToday ? 'bg-gray-800 text-white'
                               : 'hover:bg-gray-800/60 text-gray-300',
                        !isSel && colIdx === 5 ? 'text-blue-400'  : '',
                        !isSel && colIdx === 6 ? 'text-red-400'   : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <span className="text-xs font-medium leading-none">{day}</span>
                      {(hasSub || hasLst) && (
                        <div className="flex gap-0.5 mt-1">
                          {hasSub && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-blue-400'}`} />}
                          {hasLst && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-emerald-400'}`} />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* 범례 */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />청약
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />상장
                </div>
              </div>
            </div>

            {/* ── 선택 날짜 이벤트 목록 ──────────────────── */}
            {selected && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-300">
                    {selected.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2월 $3일')}
                  </h2>
                  <span className="text-xs text-gray-600">
                    {totalSelected > 0 ? `${totalSelected}건` : '일정 없음'}
                  </span>
                </div>

                {selectedEvents?.listing.map((item, i) => (
                  <IpoCard key={`lst-${i}`} item={item} type="listing" />
                ))}
                {selectedEvents?.subscribe.map((item, i) => (
                  <IpoCard key={`sub-${i}`} item={item} type="subscribe" />
                ))}
                {totalSelected === 0 && (
                  <p className="text-xs text-gray-600 text-center py-6">이 날은 공모주 일정이 없어요</p>
                )}
              </div>
            )}

            {data && data.items.length === 0 && !error && (
              <p className="text-xs text-gray-600 text-center py-8">현재 예정된 공모주 일정이 없어요</p>
            )}
          </>
        )}
          </>
        )}
      </div>
    </div>
  )
}
