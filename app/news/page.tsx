'use client'

import { useEffect, useState, useCallback, useRef, type MouseEvent } from 'react'
import type { ResearchData, ResearchItem } from '@/app/api/research/route'

const AFTER_DATE = '2026-01-01'

// ── 날짜 포맷: "26.05.29" → "2026.05.29" ─────────────────────
function fmtDate(d: string): string {
  if (!d) return '—'
  const parts = d.split('.')
  if (parts.length === 3 && parts[0].length === 2) return '20' + parts.join('.')
  return d
}

// ── 로딩 스켈레톤 행 ──────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800/50">
      <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-800 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-64 bg-gray-800 rounded animate-pulse" /></td>
      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-24 bg-gray-800 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-800 rounded animate-pulse ml-auto" /></td>
    </tr>
  )
}

// ── 단일 리서치 행 ────────────────────────────────────────────
// finance.naver.com은 모바일 UA를 감지하면 m.stock.naver.com으로 리다이렉트해
// nid 파라미터를 잃어버리고 리포트 홈으로 떨어짐.
// 모바일에서는 PDF(pstatic.net CDN, 리다이렉트 없음)를 우선 사용하고,
// PDF가 없는 경우에만 데스크탑 URL로 폴백.
function getReportUrl(item: ResearchItem): string {
  if (typeof window === 'undefined') return item.readUrl
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  if (isMobile && item.pdfUrl) return item.pdfUrl
  return item.readUrl
}

function ResearchRow({ item }: { item: ResearchItem }) {
  const handleTitleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.open(getReportUrl(item), '_blank', 'noopener,noreferrer')
  }

  return (
    <tr className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors group">
      {/* 종목 */}
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <a
          href={`https://finance.naver.com/item/main.naver?code=${item.stockCode}`}
          target="_blank" rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
        >
          {item.stockName}
        </a>
      </td>

      {/* 리포트 제목 */}
      <td className="px-4 py-3 align-top">
        <div className="flex items-start gap-2">
          <a
            href={item.readUrl}
            onClick={handleTitleClick}
            target="_blank" rel="noopener noreferrer"
            className="text-gray-200 hover:text-white text-sm leading-snug transition-colors"
          >
            {item.isNew && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-extrabold bg-red-500/25 text-red-400 border border-red-500/30 mr-1.5 align-middle relative top-[-1px]">
                N
              </span>
            )}
            {item.title}
          </a>
          {item.pdfUrl && (
            <a
              href={item.pdfUrl}
              target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded px-1.5 py-0.5 hover:bg-orange-500/25 transition-colors whitespace-nowrap"
              onClick={e => e.stopPropagation()}
            >
              PDF
            </a>
          )}
        </div>
      </td>

      {/* 증권사 */}
      <td className="px-4 py-3 align-top text-gray-400 text-xs whitespace-nowrap hidden sm:table-cell">
        {item.firm}
      </td>

      {/* 날짜 */}
      <td className="px-4 py-3 align-top text-gray-500 text-xs text-right whitespace-nowrap tabular-nums">
        {fmtDate(item.date)}
      </td>
    </tr>
  )
}

// ══════════════════════════════════════════════════════════════
// ── 메인 페이지 ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function NewsPage() {
  // ── 페이지 모드 상태 ─────────────────────────────────────────
  const [data,    setData]    = useState<ResearchData | null>(null)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  // ── 검색 상태 ────────────────────────────────────────────────
  const [search,       setSearch]       = useState('')
  const [searchItems,  setSearchItems]  = useState<ResearchItem[] | null>(null)  // null = 페이지 모드
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError,  setSearchError]  = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 현재 페이지 로드 ─────────────────────────────────────────
  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/research?page=${p}&afterDate=${AFTER_DATE}`)
      if (!res.ok) throw new Error('API error')
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  // ── 검색어 변경 시 디바운스 전체 검색 ────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = search.trim()
    if (trimmed.length < 2) {
      setSearchItems(null)
      setSearchError(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      setSearchError(false)
      try {
        const res = await fetch(
          `/api/research/search?q=${encodeURIComponent(trimmed)}&afterDate=${AFTER_DATE}`,
        )
        if (!res.ok) throw new Error()
        const json = await res.json()
        setSearchItems(json.items ?? [])
      } catch {
        setSearchError(true)
        setSearchItems(null)
      } finally {
        setSearchLoading(false)
      }
    }, 800)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // ── 렌더링 계산 ──────────────────────────────────────────────
  const isSearchMode  = search.trim().length >= 2
  const totalPages    = data?.totalPages ?? null
  const reachedCutoff = data?.reachedCutoff ?? false

  // 테이블에 보여줄 행
  const tableItems: ResearchItem[] = isSearchMode
    ? (searchItems ?? [])
    : (data?.items ?? [])

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-6 flex flex-col gap-4">

        {/* ── 헤더 ───────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">📰</span>
            <h1 className="text-lg font-bold">종목 리서치</h1>
            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">네이버 금융</span>
            <span className="text-xs text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              2026년 1월 1일 이후
            </span>
          </div>
          {!isSearchMode && (
            <button
              onClick={() => load(page)}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? '로딩 중…' : '↻ 새로고침'}
            </button>
          )}
        </div>

        {/* ── 검색 바 ─────────────────────────────────── */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="종목명, 증권사, 제목으로 검색... (2글자 이상 입력 시 전체 검색)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 pl-9 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchItems(null) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >×</button>
          )}
        </div>

        {/* ── 전체 검색 로딩 배너 ─────────────────────── */}
        {isSearchMode && searchLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
            <span className="animate-spin inline-block">⟳</span>
            2026년 1월 1일 이후 전체 리서치에서 검색 중... (수십 초 소요될 수 있어요)
          </div>
        )}

        {/* ── 전체 검색 결과 수 배너 ──────────────────── */}
        {isSearchMode && !searchLoading && searchItems !== null && (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5">
            <span className="text-blue-400">🔎 전체 검색</span>
            <span className="text-gray-600">|</span>
            <span>
              <span className="text-white font-medium">{searchItems.length.toLocaleString()}건</span> 검색됨
            </span>
          </div>
        )}

        {/* ── 에러 상태 (페이지 모드) ─────────────────── */}
        {!isSearchMode && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
            데이터를 불러오는 데 실패했어요. 네이버 금융 접근에 문제가 있을 수 있어요.
            <button onClick={() => load(page)} className="ml-2 underline hover:text-red-300">재시도</button>
          </div>
        )}

        {/* ── 에러 상태 (검색 모드) ───────────────────── */}
        {isSearchMode && searchError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
            전체 검색 중 오류가 발생했어요.
            <button onClick={() => setSearch(s => s)} className="ml-2 underline hover:text-red-300">재시도</button>
          </div>
        )}

        {/* ── 테이블 ─────────────────────────────────── */}
        {(!error || isSearchMode) && (
          <div className="rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/80 border-b border-gray-800 text-gray-500 text-xs font-medium">
                  <th className="text-left px-4 py-3 w-28">종목</th>
                  <th className="text-left px-4 py-3">리포트 제목</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell w-36">증권사</th>
                  <th className="text-right px-4 py-3 w-28">날짜</th>
                </tr>
              </thead>
              <tbody>
                {/* 전체 검색 중 스켈레톤 */}
                {isSearchMode && searchLoading &&
                  Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
                }

                {/* 페이지 로딩 스켈레톤 */}
                {!isSearchMode && loading &&
                  Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)
                }

                {/* 결과 행 */}
                {!searchLoading && !(!isSearchMode && loading) && tableItems.length > 0 &&
                  tableItems.map(item => <ResearchRow key={item.nid} item={item} />)
                }

                {/* 빈 상태 */}
                {!searchLoading && !(!isSearchMode && loading) && tableItems.length === 0 && !searchError && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-600 text-sm">
                      {isSearchMode
                        ? `"${search.trim()}"에 해당하는 리서치가 없어요`
                        : '데이터가 없어요'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 페이지 네비게이션 (페이지 모드만) ────────── */}
        {!isSearchMode && !loading && !error && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              ← 이전
            </button>
            <span className="text-sm text-gray-400 tabular-nums">
              {page}
              {totalPages ? ` / ${totalPages}` : ''} 페이지
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(totalPages !== null && page >= totalPages) || reachedCutoff}
              className="px-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              다음 →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
