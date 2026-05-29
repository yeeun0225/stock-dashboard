'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { type Signal, SIGNAL_CONFIG, loadSignals } from '@/lib/signals'

interface StockQuote {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
}

const STORAGE_KEY = 'mlm-watchlist'
const REFRESH_MS = 5 * 60 * 1000

function formatPrice(price: number, currency: string): string {
  if (price === 0) return '—'
  if (currency === 'KRW' || currency === 'JPY') {
    return price.toLocaleString()
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pctColor(pct: number) {
  return pct >= 0 ? 'text-green-400' : 'text-red-400'
}

function pctLabel(pct: number) {
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

function SignalDot({ ticker }: { ticker: string }) {
  const [signal, setSignal] = useState<Signal | null>(null)
  useEffect(() => { setSignal(loadSignals()[ticker] ?? null) }, [ticker])
  if (!signal) return null
  const cfg = SIGNAL_CONFIG[signal]
  return <span title={cfg.label}>{cfg.dot}</span>
}

function StockCard({ quote, onRemove }: { quote: StockQuote; onRemove: () => void }) {
  return (
    <div className="group bg-gray-800 hover:bg-gray-750 rounded-lg px-3 py-2.5 flex items-center gap-2 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <SignalDot ticker={quote.ticker} />
          <span className="text-xs font-bold text-white">{quote.ticker}</span>
        </div>
        <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">{quote.name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-white tabular-nums leading-tight">
          {formatPrice(quote.price, quote.currency)}
        </p>
        <p className={`text-xs font-medium tabular-nums leading-tight ${pctColor(quote.changePercent)}`}>
          {pctLabel(quote.changePercent)}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 text-xl leading-none shrink-0 w-5 text-center"
        title="삭제"
      >
        ×
      </button>
    </div>
  )
}

export default function Watchlist() {
  const router = useRouter()
  const [tickers, setTickers] = useState<string[]>([])
  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load from localStorage (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setTickers(JSON.parse(saved))
    } catch {}
  }, [])

  const fetchQuotes = useCallback(async (tickerList: string[]) => {
    if (tickerList.length === 0) { setQuotes([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/quote?tickers=${tickerList.join(',')}`)
      const data: StockQuote[] = await res.json()
      setQuotes(data)
      setLastUpdated(new Date())
    } catch {}
    finally { setLoading(false) }
  }, [])

  // Fetch on tickers change
  useEffect(() => { fetchQuotes(tickers) }, [tickers, fetchQuotes])

  // Auto-refresh every 5 min
  useEffect(() => {
    const id = setInterval(() => fetchQuotes(tickers), REFRESH_MS)
    return () => clearInterval(id)
  }, [tickers, fetchQuotes])

  const saveTickers = (list: string[]) => {
    setTickers(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  const addTicker = async () => {
    const t = input.trim().toUpperCase()
    if (!t) return
    if (tickers.includes(t)) { setAddError('이미 추가된 종목이에요'); return }
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch(`/api/quote?tickers=${t}`)
      const data: StockQuote[] = await res.json()
      if (!data[0] || data[0].price === 0) {
        setAddError('종목을 찾을 수 없어요')
        return
      }
      saveTickers([...tickers, t])
      setQuotes((prev) => [...prev, data[0]])
      setInput('')
      // 추가 후 종목카드 탭으로 이동
      router.push('/cards')
    } catch {
      setAddError('오류가 발생했어요')
    } finally {
      setAdding(false)
    }
  }

  const removeTicker = (t: string) => {
    saveTickers(tickers.filter((x) => x !== t))
    setQuotes((prev) => prev.filter((q) => q.ticker !== t))
  }

  const timeLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">관심종목</h2>
        <div className="flex items-center gap-2">
          {timeLabel && <span className="text-xs text-gray-600">{timeLabel}</span>}
          <button
            onClick={() => fetchQuotes(tickers)}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
            title="새로고침"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add form */}
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setAddError('') }}
          onKeyDown={(e) => e.key === 'Enter' && addTicker()}
          placeholder="티커 입력 (예: AAPL, 005930.KS)"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 min-w-0"
        />
        <button
          onClick={addTicker}
          disabled={adding || !input.trim()}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
        >
          {adding ? '확인 중..' : '추가'}
        </button>
      </div>
      {addError && <p className="text-xs text-red-400 -mt-1">{addError}</p>}

      {/* Cards */}
      {tickers.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-6">
          관심 종목을 추가해보세요
          <br />
          <span className="text-gray-700">US: AAPL · KR: 005930.KS · JP: 7203.T</span>
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {quotes.length === 0 && loading ? (
            <div className="text-xs text-gray-500 text-center py-4 animate-pulse">로딩 중...</div>
          ) : (
            quotes.map((q) => (
              <StockCard key={q.ticker} quote={q} onRemove={() => removeTicker(q.ticker)} />
            ))
          )}
        </div>
      )}

      {/* 종목카드 탭 링크 */}
      {tickers.length > 0 && (
        <Link
          href="/cards"
          className="block text-center text-xs text-blue-400 hover:text-blue-300 py-1 border border-blue-900 hover:border-blue-700 rounded-lg transition-colors"
        >
          📋 종목카드 상세 보기 →
        </Link>
      )}
    </div>
  )
}
