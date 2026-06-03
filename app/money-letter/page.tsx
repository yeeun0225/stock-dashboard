'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface Letter {
  id: string
  sender: 'uppity' | 'dig'
  subject: string
  content: string
  received_at: string
}

const SENDER_INFO = {
  uppity: { label: '어피티', color: 'text-violet-400', border: 'border-violet-400/30', bg: 'bg-violet-400/5' },
  dig:    { label: '디그',   color: 'text-blue-400',   border: 'border-blue-400/30',   bg: 'bg-blue-400/5'   },
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 날짜별로 그룹핑
function groupByDate(letters: Letter[]) {
  const map = new Map<string, Letter[]>()
  for (const l of letters) {
    const date = fmtDate(l.received_at)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(l)
  }
  return map
}

// 이메일 HTML에 반응형 CSS 주입
function wrapEmailHtml(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box !important; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    font-family: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif !important;
  }
  body { padding: 0 !important; }
  /* 고정 너비 테이블 반응형으로 */
  table { max-width: 100% !important; width: 100% !important; }
  td { word-break: break-word !important; }
  /* 이미지 반응형 */
  img { max-width: 100% !important; height: auto !important; display: block !important; }
  /* 최상위 컨테이너 너비 제한 해제 */
  [style*="max-width"] { max-width: 100% !important; }
  [style*="width: 600"] { width: 100% !important; }
  [style*="width:600"] { width: 100% !important; }
  /* 좌우 패딩 */
  body > * { padding-left: 12px !important; padding-right: 12px !important; }
</style>
</head>
<body>${html}</body>
</html>`
}

// ── 개별 레터 뷰어 ────────────────────────────────────────────
function LetterModal({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(600)

  const handleIframeLoad = () => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    const h = iframe.contentDocument.body.scrollHeight
    setIframeHeight(h + 32)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl my-8 overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] font-bold shrink-0 ${
              letter.sender === 'uppity' ? 'text-violet-600' : 'text-blue-600'
            }`}>
              {SENDER_INFO[letter.sender].label}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{fmtDate(letter.received_at)}</span>
            <p className="text-xs font-semibold text-gray-700 truncate">{letter.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 text-lg leading-none transition-colors"
          >×</button>
        </div>
        {/* 이메일 본문 - iframe으로 원본 그대로 렌더링 */}
        <iframe
          ref={iframeRef}
          srcDoc={wrapEmailHtml(letter.content)}
          sandbox="allow-same-origin allow-popups"
          onLoad={handleIframeLoad}
          style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', display: 'block' }}
          title={letter.subject}
        />
      </div>
    </div>
  )
}

// ── 레터 카드 ─────────────────────────────────────────────────
function LetterCard({ letter, onClick }: { letter: Letter; onClick: () => void }) {
  const info = SENDER_INFO[letter.sender]
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-gray-900 border ${info.border} rounded-xl px-4 py-3 hover:bg-gray-800/60 transition-colors`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-bold ${info.color}`}>{info.label}</span>
        <span className="text-[10px] text-gray-500">{fmtDate(letter.received_at)}</span>
      </div>
      <p className="text-xs text-gray-200 leading-snug line-clamp-2">{letter.subject}</p>
    </button>
  )
}

// ── 섹션 (어피티 or 디그) ─────────────────────────────────────
function SenderSection({
  sender, letters, onSelect,
}: {
  sender: 'uppity' | 'dig'
  letters: Letter[]
  onSelect: (l: Letter) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const info = SENDER_INFO[sender]
  const grouped = groupByDate(letters)
  const dates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))

  // 최신 10개
  const recent = letters.slice(0, 10)
  const recentGrouped = groupByDate(recent)
  const recentDates = Array.from(recentGrouped.keys()).sort((a, b) => b.localeCompare(a))

  const displayDates = showAll ? dates : recentDates
  const displayGrouped = showAll ? grouped : recentGrouped

  return (
    <div className={`border ${info.border} ${info.bg} rounded-2xl p-4`}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
          <span className="text-xs text-gray-500">{letters.length}개</span>
        </div>
        {letters.length > 10 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className={`text-xs font-medium ${info.color} hover:opacity-70 transition-opacity`}
          >
            {showAll ? '접기' : `더보기 +${letters.length - 10}`}
          </button>
        )}
      </div>

      {/* 날짜별 리스트 */}
      {letters.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-6">아직 받은 뉴스레터가 없어요</p>
      ) : (
        <div className="flex flex-col gap-4">
          {displayDates.map(date => (
            <div key={date}>
              <p className="text-[10px] text-gray-500 font-medium mb-1.5">{date}</p>
              <div className="flex flex-col gap-1.5">
                {displayGrouped.get(date)!.map(l => (
                  <LetterCard key={l.id} letter={l} onClick={() => onSelect(l)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function MoneyLetterPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Letter | null>(null)

  useEffect(() => {
    supabase
      .from('money_letters')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLetters((data as Letter[]) ?? [])
        setLoading(false)
      })
  }, [])

  const uppity = letters.filter(l => l.sender === 'uppity')
  const dig    = letters.filter(l => l.sender === 'dig')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">💌</span>
          <div>
            <h1 className="text-lg font-bold text-white">머니레터</h1>
            <p className="text-xs text-gray-500">어피티 · 디그 뉴스레터 모아보기</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <SenderSection sender="uppity" letters={uppity} onSelect={setSelected} />
            <SenderSection sender="dig"    letters={dig}    onSelect={setSelected} />
          </div>
        )}
      </div>

      {/* 레터 뷰어 모달 */}
      {selected && <LetterModal letter={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
