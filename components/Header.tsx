import { calcWeather, formatUpdateTime } from '@/lib/market-utils'
import type { MarketData } from '@/lib/types'

interface Props {
  market: MarketData | null
}

export default function Header({ market }: Props) {
  const weather =
    market
      ? calcWeather(
          market.indices.nasdaq.changePercent,
          market.indices.sp500.changePercent,
          market.indices.kospi.changePercent
        )
      : null

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="text-2xl" title={weather?.description}>
          {weather?.emoji ?? '⏳'}
        </span>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">
            모닝 대시보드
          </h1>
          {weather && (
            <p className="text-xs text-gray-400">
              {weather.label} — {weather.description}
            </p>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs text-gray-500">업데이트</p>
        <p className="text-xs text-gray-300 tabular-nums">
          {market ? formatUpdateTime(market.timestamp) : '—'}
        </p>
      </div>
    </header>
  )
}
