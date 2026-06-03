'use client'

import { useEffect, useState, useCallback } from 'react'
import { type Note, loadNotes, SECTORS, formatNoteDate } from '@/lib/notes'
import NoteEditor from '@/components/NoteEditor'
import NoteCard from '@/components/NoteCard'

export default function StudyPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showEditor, setShowEditor] = useState(false)

  // 필터 상태
  const [search,       setSearch]       = useState('')   // 종목 검색
  const [activeSector, setActiveSector] = useState<string | null>(null)
  const [activeTab,    setActiveTab]    = useState<'sector' | 'date'>('date')

  const refresh = useCallback(() => setNotes(loadNotes()), [])
  useEffect(() => { refresh() }, [refresh])

  // 섹터 필터 목록
  const usedSectors = SECTORS.filter(s => notes.some(n => n.sectors.includes(s)))

  // 종목 검색 + 섹터 필터 적용
  const filtered = notes.filter(n => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || (
      n.ticker?.toLowerCase().includes(q) ||
      n.stockName?.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    )
    const matchSector = !activeSector || n.sectors.includes(activeSector)
    return matchSearch && matchSector
  })

  // 섹터별 그룹
  const bySector: Record<string, Note[]> = {}
  const displaySectors = activeSector ? [activeSector] : usedSectors
  for (const s of displaySectors) {
    const sNotes = filtered.filter(n => n.sectors.includes(s))
    if (sNotes.length) bySector[s] = sNotes
  }

  // 날짜별 그룹
  const byDate: Record<string, Note[]> = {}
  for (const n of filtered) {
    const d = formatNoteDate(n.createdAt)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(n)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-24">

      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-white">📚 공부 노트</h1>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span>+</span>
          <span>새 노트</span>
        </button>
      </header>

      <main className="px-3 py-4 max-w-3xl mx-auto flex flex-col gap-4">

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-gray-500 text-sm">아직 작성한 노트가 없어요</p>
            <button
              onClick={() => setShowEditor(true)}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >첫 번째 노트 작성하기</button>
          </div>
        ) : (
          <>
            {/* 종목 검색 */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="종목명 또는 티커로 검색 (예: NVDA, 삼성전자)"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none"
                >×</button>
              )}
            </div>

            {/* 섹터 필터 */}
            {usedSectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveSector(null)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    activeSector === null
                      ? 'bg-white/10 border-gray-400 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >전체 ({notes.length})</button>
                {usedSectors.map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveSector(s === activeSector ? null : s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      activeSector === s
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >{s} ({notes.filter(n => n.sectors.includes(s)).length})</button>
                ))}
              </div>
            )}

            {/* 검색 결과 없음 */}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-10">검색 결과가 없어요</p>
            )}

            {/* 탭 전환 */}
            {filtered.length > 0 && (
              <div className="flex gap-1 bg-gray-900 p-1 rounded-xl">
                {(['date', 'sector'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >{tab === 'date' ? '날짜별' : '섹터별'}</button>
                ))}
              </div>
            )}

            {/* 날짜별 */}
            {activeTab === 'date' && filtered.length > 0 && (
              <div className="flex flex-col gap-4">
                {Object.entries(byDate).map(([date, dateNotes]) => (
                  <div key={date} className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-500">{date}</p>
                    {dateNotes.map(n => (
                      <NoteCard key={n.id} note={n} onChange={refresh} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* 섹터별 */}
            {activeTab === 'sector' && filtered.length > 0 && (
              <div className="flex flex-col gap-4">
                {Object.entries(bySector).map(([sector, sNotes]) => (
                  <div key={sector} className="flex flex-col gap-2">
                    <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                      <span className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5">{sector}</span>
                      <span className="text-gray-600">{sNotes.length}개</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sNotes.map(n => (
                        <NoteCard key={n.id} note={n} onChange={refresh} />
                      ))}
                    </div>
                  </div>
                ))}
                {/* 태그 없는 노트 */}
                {(() => {
                  const untagged = filtered.filter(n => n.sectors.length === 0)
                  return untagged.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                        <span className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5">태그 없음</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {untagged.map(n => <NoteCard key={n.id} note={n} onChange={refresh} />)}
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </>
        )}
      </main>

      {showEditor && (
        <NoteEditor
          initial={{ type: 'study' }}
          onSave={() => { setShowEditor(false); refresh() }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
