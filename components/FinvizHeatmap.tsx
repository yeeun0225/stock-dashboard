'use client'

import { useState } from 'react'

interface Tab {
  label: string
  flag: string
  dataSource: string
}

const TABS: Tab[] = [
  { label: '미국', flag: '🇺🇸', dataSource: 'SPX500' },
  { label: '한국', flag: '🇰🇷', dataSource: 'AllKR' },
  { label: '일본', flag: '🇯🇵', dataSource: 'NI225' },
]

function buildUrl(dataSource: string): string {
  const config = {
    exchanges: [],
    dataSource,
    grouping: 'sector',
    blockSize: 'market_cap_basic',
    blockColor: 'change',
    colorTheme: 'dark',
    hasTopBar: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    width: '100%',
    height: 400,
  }
  // TradingView embed 위젯은 파라미터를 hash(#)에 JSON으로 넘겨야 함
  return (
    'https://s.tradingview.com/embed-widget/stock-heatmap/?locale=kr#' +
    encodeURIComponent(JSON.stringify(config))
  )
}

export default function MarketHeatmap() {
  const [active, setActive] = useState(0)

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3 border border-gray-800 col-span-2 md:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          증시 히트맵
        </h2>
        <a
          href="https://www.tradingview.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          TradingView ↗
        </a>
      </div>

      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active === i
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{tab.flag}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <iframe
        key={active}
        src={buildUrl(TABS[active].dataSource)}
        width="100%"
        height="400"
        className="rounded-lg border-0"
        allowFullScreen
      />
    </div>
  )
}
