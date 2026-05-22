import type { ZoneItem } from '@/lib/types'
import { formatPercent, getChangeColor } from '@/lib/market-utils'

interface Props {
  title: string
  items: ZoneItem[]
  loading?: boolean
}

export default function ZoneCard({ title, items, loading }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 border border-gray-800">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </h2>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 bg-gray-700 rounded w-3/4" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <span className="text-gray-300 text-sm truncate">{item.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-white text-sm font-medium tabular-nums">
                  {item.value}
                </span>
                <span
                  className={`text-xs tabular-nums ${getChangeColor(item.changePercent)}`}
                >
                  {formatPercent(item.changePercent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
