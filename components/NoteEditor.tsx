'use client'

import { useState, useEffect, useRef } from 'react'
import { SECTORS, type Note, saveNote, genId } from '@/lib/notes'

interface Props {
  initial?: Partial<Note>
  onSave: (note: Note) => void | Promise<void>
  onClose: () => void
}

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload-image', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) { alert(data.error ?? '업로드 실패'); return null }
  return data.url as string
}

export default function NoteEditor({ initial, onSave, onClose }: Props) {
  const [content,     setContent]     = useState(initial?.content ?? '')
  const [ticker,      setTicker]      = useState(initial?.ticker ?? '')
  const [stockName,   setStockName]   = useState(initial?.stockName ?? '')
  const [sectors,     setSectors]     = useState<string[]>(initial?.sectors ?? [])
  const [newsLink,    setNewsLink]    = useState(initial?.newsLink ?? '')
  const [imageUrls,   setImageUrls]   = useState<string[]>(initial?.imageUrls ?? [])
  const [uploading,   setUploading]   = useState(false)
  const [sectorInput, setSectorInput] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const toggleSector = (s: string) =>
    setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const addCustomSector = () => {
    const val = sectorInput.trim()
    if (val && !sectors.includes(val)) setSectors(prev => [...prev, val])
    setSectorInput('')
  }

  // 파일 선택 → 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const urls: string[] = []
    for (const f of files) {
      const url = await uploadImage(f)
      if (url) urls.push(url)
    }
    setImageUrls(prev => [...prev, ...urls])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 내용 textarea에 이미지 붙여넣기
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(i => i.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    setUploading(true)
    const file = imageItem.getAsFile()
    if (file) {
      const url = await uploadImage(file)
      if (url) setImageUrls(prev => [...prev, url])
    }
    setUploading(false)
  }

  const removeImage = (url: string) =>
    setImageUrls(prev => prev.filter(u => u !== url))

  const handleSave = () => {
    if (!content.trim() && imageUrls.length === 0) return
    const now = Date.now()
    const note: Note = {
      id:        initial?.id ?? genId(),
      type:      initial?.type ?? 'study',
      ticker:    ticker.trim() || undefined,
      stockName: stockName.trim() || ticker.trim() || undefined,
      sectors,
      content:   content.trim(),
      newsLink:  newsLink.trim() || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    }
    saveNote(note)
    onSave(note)
  }

  const canSave = content.trim() || imageUrls.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-lg bg-gray-900 rounded-t-2xl md:rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[92vh]">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <h3 className="text-sm font-bold text-white">
            {initial?.id ? '노트 수정' : '새 노트'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

          {/* 내용 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">
              내용 <span className="text-gray-600 font-normal">(이미지 복사 후 붙여넣기 가능)</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onPaste={handlePaste}
              placeholder="오늘 공부한 내용, 뉴스 인사이트, 종목 분석을 자유롭게 적어보세요&#10;이미지를 복사(Ctrl+C)하고 여기에 붙여넣기(Ctrl+V)하면 첨부돼요"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              rows={5}
              autoFocus
            />
          </div>

          {/* 종목 태그 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">종목 태그 <span className="text-gray-600">(선택)</span></label>
            <div className="flex gap-2">
              <input
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="티커 (예: NVDA, 005930)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                value={stockName}
                onChange={e => setStockName(e.target.value)}
                placeholder="종목명 (예: 엔비디아)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* 섹터 / 자유 태그 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-400">섹터 / 자유 태그 <span className="text-gray-600">(선택)</span></label>
            <div className="flex gap-2">
              <input
                value={sectorInput}
                onChange={e => setSectorInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSector() } }}
                placeholder="반도체, AI, 환율 등 (Enter로 추가)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={addCustomSector}
                className="px-4 py-2 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >추가</button>
            </div>
            {sectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sectors.map(s => (
                  <span key={s} className="flex items-center gap-1 text-xs bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-full px-2.5 py-1">
                    {s}
                    <button onClick={() => toggleSector(s)} className="text-blue-400 hover:text-white leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {SECTORS.filter(s => !sectors.includes(s)).map(s => (
                <button
                  key={s}
                  onClick={() => toggleSector(s)}
                  className="text-xs px-2.5 py-1 rounded-full border bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-all"
                >{s}</button>
              ))}
            </div>
          </div>

          {/* 사진 첨부 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-400">사진 첨부 <span className="text-gray-600">(선택)</span></label>

            {/* 업로드 버튼 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl py-3 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <><span className="animate-spin">⏳</span> 업로드 중...</>
              ) : (
                <><span>📷</span> 사진 선택하기</>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* 첨부된 이미지 미리보기 */}
            {imageUrls.length > 0 && (
              <div className="flex flex-col gap-2">
                {imageUrls.map((url, i) => (
                  <div key={url} className="relative group rounded-xl overflow-hidden border border-gray-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`첨부 이미지 ${i + 1}`} className="w-full object-cover max-h-60" />
                    <button
                      onClick={() => removeImage(url)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 뉴스 링크 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">뉴스 링크 <span className="text-gray-600">(선택)</span></label>
            <input
              value={newsLink}
              onChange={e => setNewsLink(e.target.value)}
              placeholder="https://..."
              type="url"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>

        {/* 푸터 */}
        <div className="px-4 py-3 border-t border-gray-800 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors">취소</button>
          <button
            onClick={handleSave}
            disabled={!canSave || uploading}
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >저장</button>
        </div>
      </div>
    </div>
  )
}
