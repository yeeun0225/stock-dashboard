'use client'

import { useState } from 'react'
import UsHeatmap from './UsHeatmap'
import KrHeatmap from './KrHeatmap'
import JpHeatmap from './JpHeatmap'

type TabId = 'us' | 'kr' | 'jp'

const TABS: { id: TabId; label: string; flag: string }[] = [
  { id: 'us', label: '미국', flag: '🇺🇸' },
  { id: 'kr', label: '한국', flag: '🇰🇷' },
  { id: 'jp', label: '일본', flag: '🇯🇵' },
]

export default function MarketHeatmap() {
  const [active, setActive] = useState<TabId>('us')

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3 border border-gray-800 col-span-2 md:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          증시 히트맵
        </h2>
        <span className="text-xs text-gray-600">Yahoo Finance</span>
      </div>

      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active === t.id
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{t.flag}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {active === 'us' && <UsHeatmap />}
      {active === 'kr' && <KrHeatmap />}
      {active === 'jp' && <JpHeatmap />}
    </div>
  )
}
