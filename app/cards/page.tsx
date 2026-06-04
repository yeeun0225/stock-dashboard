'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import StockDetailCard, { type ExtendedQuote } from '@/components/StockDetailCard'
import LoginScreen from '@/components/LoginScreen'
import { useAuth } from '@/lib/auth-client'
import { dbLoadWatchlist, dbSaveWatchlist } from '@/lib/db'

// ── 이미지 캡처 & 공유 ────────────────────────────────────────
type CaptureMode = 'save' | 'share'

async function captureCards(mode: CaptureMode, targetId: string): Promise<void> {
  const el = document.getElementById(targetId)
  if (!el) throw new Error('capture target not found')

  const html2canvas = (await import('html2canvas')).default

  const canvas = await html2canvas(el, {
    backgroundColor: '#030712',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!blob) throw new Error('blob failed')

  const today = new Date()
    .toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })
    .replace(/\.\s*/g, '')
    .replace(/\.$/, '')
  const fileName = `관심종목_${today}.png`

  if (mode === 'share') {
    const file = new File([blob], fileName, { type: 'image/png' })
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: '관심종목' })
      return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = fileName; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── 페이지 ────────────────────────────────────────────────────
export default function CardsPage() {
  const { user, loading: authLoading, signOut } = useAuth()

  const [tickers,     setTickers]     = useState<string[]>([])
  const [quotes,      setQuotes]      = useState<ExtendedQuote[]>([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [capturing,   setCapturing]   = useState<CaptureMode | null>(null)
  const captureRef = useRef<HTMLDivElement>(null)

  const fetchQuotes = useCallback(async (tickerList: string[]) => {
    if (!tickerList.length) { setLoading(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/quote?tickers=${tickerList.join(',')}`)
      const data: ExtendedQuote[] = await res.json()
      setQuotes(data)
      setLastUpdated(new Date())
    } catch {}
    finally { setLoading(false) }
  }, [])

  // 로그인 후 watchlist 로드
  useEffect(() => {
    if (!user) return
    dbLoadWatchlist(user.id)
      .then(list => { setTickers(list); fetchQuotes(list) })
      .catch(() => setLoading(false))
  }, [user, fetchQuotes])

  useEffect(() => {
    const id = setInterval(() => fetchQuotes(tickers), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [tickers, fetchQuotes])

  const removeTicker = async (ticker: string) => {
    const next = tickers.filter(t => t !== ticker)
    setTickers(next)
    setQuotes(q => q.filter(x => x.ticker !== ticker))
    if (user) await dbSaveWatchlist(user.id, next)
  }

  const handleCapture = async (mode: CaptureMode) => {
    if (capturing) return
    setCapturing(mode)
    try {
      await captureCards(mode, 'cards-capture-target')
    } catch (err) {
      console.error('[capture]', err)
      alert('이미지 생성에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setCapturing(null)
    }
  }

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">불러오는 중...</p>
      </div>
    )
  }

  // 비로그인
  if (!user) return <LoginScreen fullPage />

  const timeLabel = lastUpdated?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const hasCards  = quotes.length > 0

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← 대시보드
          </Link>
          <h1 className="text-base font-bold text-white">종목카드</h1>
        </div>

        <div className="flex items-center gap-2">
          {hasCards && (
            <>
              <button
                onClick={() => handleCapture('save')}
                disabled={!!capturing || loading}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40"
              >
                {capturing === 'save' ? <span className="animate-pulse">처리 중…</span>
                  : <>📷 <span className="hidden sm:inline">이미지 저장</span></>}
              </button>
              <button
                onClick={() => handleCapture('share')}
                disabled={!!capturing || loading}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40"
              >
                {capturing === 'share' ? <span className="animate-pulse">처리 중…</span>
                  : <>📤 <span className="hidden sm:inline">공유하기</span></>}
              </button>
            </>
          )}

          {timeLabel && <span className="text-xs text-gray-600">{timeLabel} 기준</span>}

          <button
            onClick={() => fetchQuotes(tickers)}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 로그아웃 */}
          <button
            onClick={signOut}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-1"
            title={user.email ?? '로그아웃'}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* ── 메인 ─────────────────────────────────────────────── */}
      <main className="px-3 py-4 max-w-5xl mx-auto">
        {loading && quotes.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500 animate-pulse text-sm">
            종목 데이터 로딩 중...
          </div>
        ) : tickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-gray-500 text-sm">관심 종목을 먼저 추가해주세요</p>
            <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 underline">
              대시보드에서 종목 추가하기
            </Link>
          </div>
        ) : (
          <div id="cards-capture-target" ref={captureRef} className="bg-gray-950">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800/60">
              <div>
                <p className="text-sm font-bold text-white">📊 관심종목</p>
                {timeLabel && <p className="text-xs text-gray-600 mt-0.5">{timeLabel} 기준</p>}
              </div>
              <span className="text-xs text-gray-700">stock-dashboard-pi-three.vercel.app</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {quotes.map(q => (
                <StockDetailCard key={q.ticker} quote={q} onRemove={() => removeTicker(q.ticker)} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
