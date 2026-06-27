'use client'

import { useEffect, useState } from 'react'

export interface StockQuote {
  ticker: string
  name: string
  price: number
  changePercent: number
}

export interface SectorData {
  sector: string
  stocks: StockQuote[]
}

export interface HeatmapResponse {
  sectors: SectorData[]
  session?: 'pre' | 'regular' | 'post' | 'closed'
  timestamp: number
}

function pctColor(pct: number): string {
  if (pct >= 4) return 'bg-green-500 text-white'
  if (pct >= 2) return 'bg-green-600 text-white'
  if (pct >= 0.5) return 'bg-green-700 text-white'
  if (pct > -0.5) return 'bg-gray-600 text-gray-200'
  if (pct > -2) return 'bg-red-700 text-white'
  if (pct > -4) return 'bg-red-600 text-white'
  return 'bg-red-500 text-white'
}

function pctLabel(pct: number): string {
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

function StockTile({ stock }: { stock: StockQuote }) {
  return (
    <div
      className={`${pctColor(stock.changePercent)} rounded px-1 py-1 flex flex-col items-center justify-center text-center min-w-0 cursor-default select-none`}
      style={{ minHeight: '52px' }}
      title={`${stock.name} (${stock.ticker})\n${stock.price.toLocaleString()} | ${pctLabel(stock.changePercent)}`}
    >
      <span className="text-xs font-semibold leading-tight truncate w-full text-center">
        {stock.name}
      </span>
      <span className="text-xs leading-tight opacity-90 font-medium mt-0.5">
        {pctLabel(stock.changePercent)}
      </span>
    </div>
  )
}

function SectorBlock({ sector }: { sector: SectorData }) {
  const avgPct =
    sector.stocks.length > 0
      ? sector.stocks.reduce((s, st) => s + st.changePercent, 0) / sector.stocks.length
      : 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-300">{sector.sector}</span>
        <span className={`text-xs font-medium ${avgPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {pctLabel(avgPct)}
        </span>
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
      >
        {sector.stocks.map((st) => (
          <StockTile key={st.ticker} stock={st} />
        ))}
      </div>
    </div>
  )
}

interface Props {
  apiPath: string
}

export default function StockHeatmap({ apiPath }: Props) {
  const [data, setData] = useState<HeatmapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(apiPath)
      if (!res.ok) throw new Error('fetch failed')
      const json: HeatmapResponse = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 5 * 60 * 1000) // 5분마다 자동 갱신
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm animate-pulse">
        주식 데이터 로딩 중...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <span className="text-gray-500 text-sm">데이터를 불러오지 못했습니다</span>
        <button onClick={load} className="text-xs text-blue-400 hover:text-blue-300 underline">
          다시 시도
        </button>
      </div>
    )
  }

  const updateTime = new Date(data.timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '480px' }}>
      <div className="flex justify-between items-center flex-wrap gap-1">
        <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
          {[
            { label: '▲5%+', cls: 'bg-green-500' },
            { label: '▲2%+', cls: 'bg-green-600' },
            { label: '▲0.5%+', cls: 'bg-green-700' },
            { label: '보합', cls: 'bg-gray-600' },
            { label: '▼0.5%+', cls: 'bg-red-700' },
            { label: '▼2%+', cls: 'bg-red-600' },
            { label: '▼5%+', cls: 'bg-red-500' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${l.cls}`} />
              {l.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {data.session === 'pre' && (
            <span className="text-xs font-medium text-blue-400 border border-blue-700 px-1.5 py-0.5 rounded">
              NXT 장전
            </span>
          )}
          {data.session === 'post' && (
            <span className="text-xs font-medium text-purple-400 border border-purple-700 px-1.5 py-0.5 rounded">
              NXT 장후
            </span>
          )}
          <span className="text-xs text-gray-600">{updateTime} 기준</span>
        </div>
      </div>

      {data.sectors.map((s) => (
        <SectorBlock key={s.sector} sector={s} />
      ))}
    </div>
  )
}
