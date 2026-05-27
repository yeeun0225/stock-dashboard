'use client'

import { useEffect, useRef, useState } from 'react'

interface HeatmapConfig {
  label: string
  flag: string
  exchanges?: string[]
  dataSource?: string
  grouping: string
}

const TABS: HeatmapConfig[] = [
  {
    label: '미국',
    flag: '🇺🇸',
    dataSource: 'SPX500',
    grouping: 'sector',
  },
  {
    label: '한국',
    flag: '🇰🇷',
    exchanges: ['KRX'],
    grouping: 'sector',
  },
  {
    label: '일본',
    flag: '🇯🇵',
    exchanges: ['TSE'],
    grouping: 'sector',
  },
]

function HeatmapWidget({ config }: { config: HeatmapConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      ...(config.exchanges ? { exchanges: config.exchanges } : { exchanges: [] }),
      ...(config.dataSource ? { dataSource: config.dataSource } : {}),
      grouping: config.grouping,
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'kr',
      colorTheme: 'dark',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '400',
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [config])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full rounded-lg overflow-hidden"
    />
  )
}

export default function MarketHeatmap() {
  const [active, setActive] = useState(0)

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3 border border-gray-800 col-span-2 md:col-span-3">
      {/* Header */}
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

      {/* Tabs */}
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

      {/* Widget */}
      <HeatmapWidget config={TABS[active]} />
    </div>
  )
}
