'use client'

import { useEffect, useState, useCallback } from 'react'
import type { StockNewsData, NewsCategory, NewsItem } from '@/app/api/stock-news/route'

// ── 기사 데이터 타입 ──────────────────────────────────────────
interface ArticleData {
  title:       string
  press:       string
  date:        string
  body:        string
  originalUrl: string
}

// ── 카테고리 아이콘 ───────────────────────────────────────────
const ICONS: Record<string, string> = {
  '경제':     '📊',
  '금융':     '🏦',
  '기업':     '🏢',
  '증권':     '📈',
  '부동산':   '🏘️',
  '테크·과학': '💻',
}

// ══════════════════════════════════════════════════════════════
// ── 기사 모달 ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
function ArticleModal({
  url,
  onClose,
}: {
  url: string
  onClose: () => void
}) {
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/stock-news/article?url=${encodeURIComponent(url)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setArticle)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [url])

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    /* ── 백드롭 ─────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      {/* ── 모달 패널 ──────────────────────────────────────── */}
      <div
        className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85dvh] bg-gray-900 sm:rounded-2xl rounded-t-2xl border border-gray-700 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <span className="text-xs text-gray-500">기사 보기</span>
          <div className="flex items-center gap-2">
            {article && (
              <a
                href={article.originalUrl}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2.5 py-1 transition-colors"
              >
                원문 보기 ↗
              </a>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-lg leading-none px-1 transition-colors"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          {loading && (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-5 bg-gray-800 rounded w-4/5" />
              <div className="h-5 bg-gray-800 rounded w-3/5" />
              <div className="h-3 bg-gray-800/60 rounded w-32 mt-1" />
              <div className="mt-4 flex flex-col gap-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={`h-3 bg-gray-800/50 rounded ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 py-6 text-center">
              <p>기사를 불러오지 못했어요.</p>
              <a
                href={url}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-400 underline text-xs"
              >
                원문 직접 열기 →
              </a>
            </div>
          )}

          {!loading && !error && article && (
            <>
              {/* 제목 */}
              <h2 className="text-base font-bold text-white leading-snug mb-2">
                {article.title}
              </h2>

              {/* 메타 */}
              {(article.press || article.date) && (
                <p className="text-xs text-gray-500 mb-4">
                  {article.press}
                  {article.press && article.date ? ' · ' : ''}
                  {article.date}
                </p>
              )}

              {/* 본문 */}
              {article.body ? (
                <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {article.body}
                </div>
              ) : (
                <div className="bg-gray-800/60 rounded-xl p-4 text-sm text-gray-400">
                  <p className="mb-1 text-gray-300 font-medium">이 언론사는 본문 추출이 제한돼요.</p>
                  <p className="text-xs text-gray-500 mb-3">아래 링크로 원문을 확인해주세요.</p>
                  <a
                    href={article.originalUrl}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline transition-colors text-sm"
                  >
                    원문 보기 ↗
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── 단일 뉴스 카드 ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
function NewsCard({
  category,
  onArticleClick,
}: {
  category:       NewsCategory
  onArticleClick: (url: string) => void
}) {
  const [top, ...rest] = category.items
  const icon  = ICONS[category.label] ?? '📰'
  const empty = category.items.length === 0

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <h2 className="text-sm font-bold text-gray-200">{category.label}</h2>
      </div>

      {empty ? (
        <p className="px-4 py-6 text-xs text-gray-600 text-center">뉴스 없음</p>
      ) : (
        <>
          {/* 탑 기사 */}
          {top && (
            <button
              onClick={() => onArticleClick(top.url)}
              className="block w-full text-left px-4 pt-3 pb-2.5 hover:bg-gray-800/40 transition-colors group"
            >
              <p className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {top.title}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {top.press}
                {top.time && <span className="ml-1.5 text-gray-600">{top.time}</span>}
              </p>
            </button>
          )}

          {/* 나머지 기사 */}
          {rest.length > 0 && (
            <>
              <div className="mx-4 border-t border-gray-800/70" />
              <ul className="px-4 py-2 flex flex-col divide-y divide-gray-800/50">
                {rest.map((item: NewsItem, i: number) => (
                  <li key={i} className="py-1.5 first:pt-2 last:pb-2">
                    <button
                      onClick={() => onArticleClick(item.url)}
                      className="w-full flex items-start justify-between gap-2 text-left group"
                    >
                      <span className="text-xs text-gray-400 group-hover:text-gray-200 leading-snug transition-colors line-clamp-2">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0 mt-0.5">
                        {item.press}
                      </span>
                    </button>
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
// ── 메인 페이지 ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function StockNewsPage() {
  const [data,         setData]         = useState<StockNewsData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [activeUrl,    setActiveUrl]    = useState<string | null>(null)

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
                <NewsCard
                  key={cat.key}
                  category={cat}
                  onArticleClick={setActiveUrl}
                />
              ))
          }
        </div>

      </div>

      {/* ── 기사 모달 ─────────────────────────────────────── */}
      {activeUrl && (
        <ArticleModal
          url={activeUrl}
          onClose={() => setActiveUrl(null)}
        />
      )}
    </div>
  )
}
