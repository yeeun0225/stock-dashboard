'use client'

import { useEffect, useState, useCallback } from 'react'
import type { StockNewsData, NewsCategory, NewsItem } from '@/app/api/stock-news/route'

// ── 카테고리 아이콘 ───────────────────────────────────────────
const ICONS: Record<string, string> = {
  '시황·전망':    '📈',
  '기업·종목분석': '🏢',
  '해외증시':    '🌐',
  '채권·선물':   '📊',
  '공시·메모':   '📋',
  '환율':        '💱',
}

// ── 단일 뉴스 카드 ────────────────────────────────────────────
function NewsCard({ category }: { category: NewsCategory }) {
  const [top, ...rest] = category.items
  const icon = ICONS[category.label] ?? '📰'
  const isEmpty = category.items.length === 0

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <h2 className="text-sm font-bold text-gray-200">{category.label}</h2>
      </div>

      {isEmpty ? (
        <p className="px-4 py-6 text-xs text-gray-600 text-center">뉴스 없음</p>
      ) : (
        <>
          {/* 탑 기사 */}
          {top && (
            <a
              href={top.url}
              target="_blank" rel="noopener noreferrer"
              className="block px-4 pt-3 pb-2.5 group hover:bg-gray-800/40 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {top.title}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {top.press}
                {top.time && <span className="ml-1.5 text-gray-600">{top.time}</span>}
              </p>
            </a>
          )}

          {/* 나머지 기사 */}
          {rest.length > 0 && (
            <>
              <div className="mx-4 border-t border-gray-800/70" />
              <ul className="px-4 py-2 flex flex-col divide-y divide-gray-800/50">
                {rest.map((item: NewsItem, i: number) => (
                  <li key={i} className="py-1.5 first:pt-2 last:pb-2">
                    <a
                      href={item.url}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-start justify-between gap-2 group"
                    >
                      <span className="text-xs text-gray-400 group-hover:text-gray-200 leading-snug transition-colors line-clamp-2">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0 mt-0.5">
                        {item.press}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── 로딩 스켈레톤 ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden animate-pulse">
      <div className="px-4 py-2.5 border-b border-gray-800">
        <div className="h-4 w-28 bg-gray-800 rounded" />
      </div>
      <div className="px-4 pt-3 pb-2.5">
        <div className="h-4 bg-gray-800 rounded w-full mb-1.5" />
        <div className="h-4 bg-gray-800 rounded w-4/5 mb-2" />
        <div className="h-3 bg-gray-800/60 rounded w-20" />
      </div>
      <div className="mx-4 border-t border-gray-800/70" />
      <ul className="px-4 py-2 flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="h-3 bg-gray-800/50 rounded w-full" />
        ))}
      </ul>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function StockNewsPage() {
  const [data,    setData]    = useState<StockNewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      const res = await fetch('/api/stock-news')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // 5분마다 자동 갱신
  useEffect(() => {
    const id = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [load])

  const timeLabel = data
    ? new Date(data.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col gap-4">

        {/* ── 헤더 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">📰</span>
            <h1 className="text-lg font-bold">경제 뉴스</h1>
            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
              네이버 금융
            </span>
          </div>
          <div className="flex items-center gap-2">
            {timeLabel && (
              <span className="text-xs text-gray-600">{timeLabel} 기준</span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? '로딩 중…' : '↻ 새로고침'}
            </button>
          </div>
        </div>

        {/* ── 에러 ─────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
            뉴스를 불러오지 못했어요.
            <button onClick={load} className="ml-2 underline hover:text-red-300">재시도</button>
          </div>
        )}

        {/* ── 뉴스 그리드 ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
            : data?.categories.map(cat => (
                <NewsCard key={cat.key} category={cat} />
              ))
          }
        </div>

      </div>
    </div>
  )
}
