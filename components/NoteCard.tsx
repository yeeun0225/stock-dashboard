'use client'

import { useState } from 'react'
import { type Note, deleteNote, formatNoteDate } from '@/lib/notes'
import { dbSaveNote, dbDeleteNote } from '@/lib/db'
import NoteEditor from './NoteEditor'

interface Props {
  note:     Note
  onChange: () => void
  userId?:  string   // 로그인 시 Supabase sync
}

// 비밀번호 모달
function PasswordModal({
  onConfirm, onClose,
}: { onConfirm: (pw: string) => void; onClose: () => void }) {
  const [pw, setPw] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white">참고자료로 공유할까요?</h3>
        <p className="text-xs text-gray-400">비밀번호를 입력하면 참고자료 탭에 공개돼요.</p>
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
          >공유</button>
        </div>
      </div>
    </div>
  )
}

export default function NoteCard({ note, onChange, userId }: Props) {
  const [editing,    setEditing]    = useState(false)
  const [expanded,   setExpanded]   = useState(false)
  const [showShare,  setShowShare]  = useState(false)
  const [shareMsg,   setShareMsg]   = useState<string | null>(null)

  const isLong = note.content.length > 120
  const displayContent = isLong && !expanded
    ? note.content.slice(0, 120) + '...'
    : note.content

  const handleDelete = async () => {
    if (!confirm('이 메모를 삭제할까요?')) return
    if (userId) await dbDeleteNote(userId, note.id)
    deleteNote(note.id)
    onChange()
  }

  const handleShare = async (pw: string) => {
    const res = await fetch('/api/reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password:  pw,
        ticker:    note.ticker,
        stockName: note.stockName,
        sectors:   note.sectors,
        content:   note.content,
        newsLink:  note.newsLink,
      }),
    })
    const data = await res.json()
    setShowShare(false)
    if (!res.ok) { setShareMsg('❌ ' + data.error); return }
    setShareMsg('✅ 참고자료에 공유됐어요!')
    setTimeout(() => setShareMsg(null), 3000)
  }

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2 border border-gray-700 hover:border-gray-600 transition-colors">
        {/* 메타 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {note.ticker && (
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                📌 {note.stockName ?? note.ticker}
                {note.stockName && note.ticker !== note.stockName && (
                  <span className="text-blue-300/60 ml-1">({note.ticker})</span>
                )}
              </span>
            )}
            {note.sectors.map(s => (
              <span key={s} className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">{s}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0" data-html2canvas-ignore="true">
            <button
              onClick={() => setShowShare(true)}
              className="text-gray-600 hover:text-green-400 transition-colors text-xs px-1"
              title="참고자료로 공유"
            >📤</button>
            <button
              onClick={() => setEditing(true)}
              className="text-gray-600 hover:text-gray-300 transition-colors text-xs px-1"
              title="수정"
            >✏️</button>
            <button
              onClick={handleDelete}
              className="text-gray-600 hover:text-red-400 transition-colors text-xs px-1"
              title="삭제"
            >🗑️</button>
          </div>
        </div>

        {/* 공유 결과 메시지 */}
        {shareMsg && (
          <p className="text-xs text-center py-1 rounded-lg bg-gray-700 text-gray-200">{shareMsg}</p>
        )}

        {/* 내용 */}
        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{displayContent}</p>
        {isLong && (
          <button onClick={() => setExpanded(v => !v)} className="text-xs text-gray-500 hover:text-gray-300 text-left">
            {expanded ? '접기 ▲' : '더 보기 ▼'}
          </button>
        )}

        {/* 뉴스 링크 */}
        {note.newsLink && (
          <a href={note.newsLink} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 truncate transition-colors">
            🔗 {note.newsLink}
          </a>
        )}

        {/* 날짜 */}
        <p className="text-xs text-gray-600 text-right">
          {formatNoteDate(note.updatedAt !== note.createdAt ? note.updatedAt : note.createdAt)}
          {note.updatedAt !== note.createdAt && ' (수정됨)'}
        </p>
      </div>

      {showShare && <PasswordModal onConfirm={handleShare} onClose={() => setShowShare(false)} />}
      {editing && (
        <NoteEditor
          initial={note}
          onSave={async (savedNote) => {
            if (userId) await dbSaveNote(userId, savedNote)
            setEditing(false)
            onChange()
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
