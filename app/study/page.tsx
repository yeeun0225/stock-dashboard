'use client'

import { useEffect, useState, useCallback } from 'react'
import { type Note, loadNotes, SECTORS, formatNoteDate } from '@/lib/notes'
import NoteEditor from '@/components/NoteEditor'
import NoteCard from '@/components/NoteCard'

export default function StudyPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeSector, setActiveSector] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const refresh = useCallback(() => setNotes(loadNotes()), [])

  useEffect(() => { refresh() }, [refresh])

  // Sectors that actually have notes
  const usedSectors = SECTORS.filter((s) => notes.some((n) => n.sectors.includes(s)))

  // Filtered notes
  const filtered = activeSector
    ? notes.filter((n) => n.sectors.includes(activeSector))
    : notes

  // Group by sector (for the top section)
  const bySector: Record<string, Note[]> = {}
  for (const s of (activeSector ? [activeSector] : usedSectors)) {
    const sNotes = notes.filter((n) => n.sectors.includes(s))
    if (sNotes.length) bySector[s] = sNotes
  }

  // Group by date (for the bottom section)
  const byDate: Record<string, Note[]> = {}
  for (const n of filtered) {
    const d = formatNoteDate(n.createdAt)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(n)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-8">
      {/* Header */}
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

      <main className="px-3 py-4 max-w-3xl mx-auto flex flex-col gap-8">

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-gray-500 text-sm">아직 작성한 노트가 없어요</p>
            <button
              onClick={() => setShowEditor(true)}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              첫 번째 노트 작성하기
            </button>
          </div>
        ) : (
          <>
            {/* Sector filter chips */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">섹터별 보기</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSector(null)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    activeSector === null
                      ? 'bg-white/10 border-gray-400 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  전체 ({notes.length})
                </button>
                {usedSectors.map((s) => {
                  const count = notes.filter((n) => n.sectors.includes(s)).length
                  return (
                    <button
                      key={s}
                      onClick={() => setActiveSector(s === activeSector ? null : s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        activeSector === s
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {s} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Sector grouped cards */}
              {Object.entries(bySector).map(([sector, sNotes]) => (
                <div key={sector} className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <span className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5">{sector}</span>
                    <span className="text-gray-600">{sNotes.length}개</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sNotes.map((n) => (
                      <NoteCard key={n.id} note={n} onChange={refresh} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800" />

            {/* Date feed */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                날짜별 보기 {activeSector && <span className="text-blue-400 normal-case">— {activeSector}</span>}
              </h2>
              {Object.entries(byDate).map(([date, dateNotes]) => (
                <div key={date} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-600">{date}</p>
                  {dateNotes.map((n) => (
                    <NoteCard key={n.id} note={n} onChange={refresh} />
                  ))}
                </div>
              ))}
            </div>
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
