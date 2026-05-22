'use client'

import { useState } from 'react'

// Finviz heatmap URLs to try in order
const HEATMAP_URLS = [
  'https://finviz.com/map.ashx?t=sec&st=d1',
  'https://finviz.com/map.ashx?t=sec',
]

export default function FinvizHeatmap() {
  const [urlIdx, setUrlIdx] = useState(0)
  const [failed, setFailed] = useState(false)

  function handleError() {
    const next = urlIdx + 1
    if (next < HEATMAP_URLS.length) {
      setUrlIdx(next)
    } else {
      setFailed(true)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 border border-gray-800 col-span-2 md:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          S&amp;P 500 섹터 히트맵
        </h2>
        <a
          href="https://finviz.com/map.ashx?t=sec"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Finviz ↗
        </a>
      </div>

      {failed ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-500">
          <span className="text-2xl">📊</span>
          <p className="text-sm">히트맵은 Finviz에서 직접 확인하세요</p>
          <a
            href="https://finviz.com/map.ashx?t=sec"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline"
          >
            Finviz 히트맵 보기 →
          </a>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={urlIdx}
          src={HEATMAP_URLS[urlIdx]}
          alt="S&P 500 섹터 히트맵"
          className="w-full rounded-lg object-contain"
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      )}
    </div>
  )
}
