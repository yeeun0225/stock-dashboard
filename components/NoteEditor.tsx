'use client'

import { useState, useEffect } from 'react'
import { SECTORS, type Note, saveNote, genId } from '@/lib/notes'

interface Props {
  initial?: Partial<Note>   // pre-fill ticker/stockName/sectors
  onSave: (note: Note) => void
  onClose: () => void
}

export default function NoteEditor({ initial, onSave, onClose }: Props) {
  const [content, setContent] = useState(initial?.content ?? '')
  const [sectors, setSectors] = useState<string[]>(initial?.sectors ?? [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const toggleSector = (s: string) =>
    setSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  const handleSave = () => {
    if (!content.trim()) return
    const now = Date.now()
    const note: Note = {
      id: initial?.id ?? genId(),
      type: initial?.type ?? 'study',
      ticker: initial?.ticker,
      stockName: initial?.stockName,
      sectors,
      content: content.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    }
    saveNote(note)
    onSave(note)
  }

  const isStock = !!initial?.ticker

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full md:max-w-lg bg-gray-900 rounded-t-2xl md:rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              {initial?.id ? '메모 수정' : '메모 추가'}
            </h3>
            {isStock && (
              <p className="text-xs text-gray-500 mt-0.5">
                {initial.stockName} · {initial.ticker}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {/* Sector tags */}
          <div>
            <p className="text-xs text-gray-500 mb-2">섹터 태그 (복수 선택 가능)</p>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => {
                const active = sectors.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleSector(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isStock
                ? `${initial?.stockName}에 대한 메모를 작성하세요...`
                : '오늘 공부한 내용, 시장 분석, 투자 아이디어 등을 자유롭게 적어보세요...'
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
            rows={6}
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
