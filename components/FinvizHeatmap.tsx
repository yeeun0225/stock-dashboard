'use client'

import { useEffect, useRef } from 'react'

export default function TradingViewHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget if any (e.g. hot reload)
    containerRef.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: 'SPX500',
      grouping: 'sector',
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
  }, [])

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 border border-gray-800 col-span-2 md:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          S&amp;P 500 섹터 히트맵
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
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full rounded-lg overflow-hidden"
      />
    </div>
  )
}
