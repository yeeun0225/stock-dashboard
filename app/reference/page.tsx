'use client'

import { useEffect, useState } from 'react'

interface RefNote {
  id: string
  ticker: string | null
  stock_name: string | null
  sectors: string[]
  content: string
  news_link: string | null
  created_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

// ── 비밀번호 모달 ─────────────────────────────────────────────
function PasswordModal({
  title,
  onConfirm,
  onClose,
}: {
  title: string
  onConfirm: (pw: string) => void
  onClose: () => void
}) {
  const [pw, setPw] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(pw) }}
          placeholder="비밀번호 입력"
          autoFocus
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-white px-4 py-2">취소</button>
          <button
            onClick={() => onConfirm(pw)}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg"
          >확인</button>
        </div>
      </div>
    </div>
  )
}

// ── 추가 모달 ─────────────────────────────────────────────────
function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step,      setStep]      = useState<'form' | 'password'>('form')
  const [content,   setContent]   = useState('')
  const [ticker,    setTicker]    = useState('')
  const [stockName, setStockName] = useState('')
  const [newsLink,  setNewsLink]  = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  const handleSubmit = async (pw: string) => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, ticker, stockName, content, newsLink }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); setStep('form'); return }
    onSaved()
  }

  if (step === 'password') {
    return (
      <PasswordModal
        title="비밀번호를 입력해주세요"
        onConfirm={handleSubmit}
        onClose={() => setStep('form')}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-gray-900 border border-gray-700 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-bold text-white">참고자료 추가</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">내용 <span className="text-red-400">*</span></label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="공유할 내용을 입력하세요"
              rows={5}
              autoFocus
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-medium text-gray-400">티커</label>
              <input
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="NVDA"
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-medium text-gray-400">종목명</label>
              <input
                value={stockName}
                onChange={e => setStockName(e.target.value)}
                placeholder="엔비디아"
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">뉴스 링크 (선택)</label>
            <input
              value={newsLink}
              onChange={e => setNewsLink(e.target.value)}
              placeholder="https://..."
              type="url"
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-200 px-4 py-2">취소</button>
          <button
            onClick={() => { if (content.trim()) setStep('password') }}
            disabled={!content.trim() || loading}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 py-2 rounded-lg"
          >다음</button>
        </div>
      </div>
    </div>
  )
}

// ── 참고자료 카드 ─────────────────────────────────────────────
function RefCard({ note, onDelete }: { note: RefNote; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showDelPw, setShowDelPw] = useState(false)
  const [delError, setDelError] = useState('')

  const isLong = note.content.length > 120

  const handleDelete = async (pw: string) => {
    const res = await fetch('/api/reference', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, id: note.id }),
    })
    if (!res.ok) { setDelError('비밀번호가 틀렸어요'); return }
    setShowDelPw(false)
    onDelete()
  }

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2.5 hover:border-gray-700 transition-colors">
        {/* 메타 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {note.ticker && (
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                📌 {note.stock_name ?? note.ticker}
                {note.stock_name && note.ticker !== note.stock_name && (
                  <span className="text-blue-300/60 ml-1">({note.ticker})</span>
                )}
              </span>
            )}
            {note.sectors?.map(s => (
              <span key={s} className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">{s}</span>
            ))}
          </div>
          <button
            onClick={() => { setDelError(''); setShowDelPw(true) }}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors shrink-0"
            title="삭제"
          >🗑️</button>
        </div>

        {/* 내용 */}
        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
          {isLong && !expanded ? note.content.slice(0, 120) + '...' : note.content}
        </p>
        {isLong && (
          <button onClick={() => setExpanded(v => !v)} className="text-xs text-gray-500 hover:text-gray-300 text-left">
            {expanded ? '접기 ▲' : '더 보기 ▼'}
          </button>
        )}

        {/* 링크 */}
        {note.news_link && (
          <a href={note.news_link} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 truncate">
            🔗 {note.news_link}
          </a>
        )}

        {/* 날짜 */}
        <p className="text-xs text-gray-600 text-right">{fmtDate(note.created_at)}</p>
      </div>

      {showDelPw && (
        <PasswordModal
          title="삭제하려면 비밀번호를 입력하세요"
          onConfirm={handleDelete}
          onClose={() => setShowDelPw(false)}
        />
      )}
      {delError && <p className="text-xs text-red-400 text-center">{delError}</p>}
    </>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function ReferencePage() {
  const [notes,   setNotes]   = useState<RefNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/reference')
    const data = await res.json()
    setNotes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = notes.filter(n => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      n.ticker?.toLowerCase().includes(q) ||
      n.stock_name?.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    )
  })

  // 날짜별 그룹
  const byDate: Record<string, RefNote[]> = {}
  for (const n of filtered) {
    const d = fmtDate(n.created_at)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(n)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📎</span>
            <div>
              <h1 className="text-lg font-bold text-white">참고자료</h1>
              <p className="text-xs text-gray-500">공유된 노트 · 인사이트 모음</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <span>+</span>
            <span>추가</span>
          </button>
        </div>

        {/* 검색 */}
        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="종목명 또는 티커로 검색"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg">×</button>
          )}
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-900 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-16">
            {search ? '검색 결과가 없어요' : '아직 등록된 자료가 없어요'}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.entries(byDate).map(([date, dateNotes]) => (
              <div key={date} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500">{date}</p>
                {dateNotes.map(n => (
                  <RefCard key={n.id} note={n} onDelete={load} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
