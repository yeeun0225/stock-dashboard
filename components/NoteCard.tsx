'use client'

import { useState } from 'react'
import { type Note, deleteNote, formatNoteDate } from '@/lib/notes'
import NoteEditor from './NoteEditor'

interface Props {
  note: Note
  onChange: () => void
}

export default function NoteCard({ note, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isLong = note.content.length > 120
  const displayContent = isLong && !expanded
    ? note.content.slice(0, 120) + '...'
    : note.content

  const handleDelete = () => {
    if (!confirm('이 메모를 삭제할까요?')) return
    deleteNote(note.id)
    onChange()
  }

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2 border border-gray-700 hover:border-gray-600 transition-colors">
        {/* Meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {note.type === 'stock' && note.ticker && (
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                📌 {note.ticker}
              </span>
            )}
            {note.type === 'study' && (
              <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                📚 공부
              </span>
            )}
            {note.sectors.map((s) => (
              <span key={s} className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0" data-html2canvas-ignore="true">
            <button
              onClick={() => setEditing(true)}
              className="text-gray-600 hover:text-gray-300 transition-colors text-xs px-1"
              title="수정"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-600 hover:text-red-400 transition-colors text-xs px-1"
              title="삭제"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
          {displayContent}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 text-left"
          >
            {expanded ? '접기 ▲' : '더 보기 ▼'}
          </button>
        )}

        {/* Date */}
        <p className="text-xs text-gray-600 text-right">
          {formatNoteDate(note.updatedAt !== note.createdAt ? note.updatedAt : note.createdAt)}
          {note.updatedAt !== note.createdAt && ' (수정됨)'}
        </p>
      </div>

      {editing && (
        <NoteEditor
          initial={note}
          onSave={() => { setEditing(false); onChange() }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
