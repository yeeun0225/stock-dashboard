interface Props {
  value: number
  classification: string
}

const LABELS = [
  { max: 25, label: '극도 공포', color: '#ef4444' },
  { max: 45, label: '공포', color: '#f97316' },
  { max: 55, label: '중립', color: '#eab308' },
  { max: 75, label: '탐욕', color: '#84cc16' },
  { max: 100, label: '극도 탐욕', color: '#22c55e' },
]

function getColor(value: number) {
  return (LABELS.find((l) => value <= l.max) ?? LABELS[4]).color
}

function getLabel(value: number) {
  return (LABELS.find((l) => value <= l.max) ?? LABELS[4]).label
}

export default function FearGreedGauge({ value, classification }: Props) {
  const clamp = Math.max(0, Math.min(100, value))
  const color = getColor(clamp)
  const korLabel = getLabel(clamp)

  // SVG semicircle gauge
  const r = 48
  const cx = 60
  const cy = 60
  const circumference = Math.PI * r
  const progress = (clamp / 100) * circumference

  // Needle angle: -90deg (left) to +90deg (right)
  const angle = -90 + (clamp / 100) * 180
  const rad = (angle * Math.PI) / 180
  const nx = cx + r * Math.cos(rad)
  const ny = cy + r * Math.sin(rad)

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 border border-gray-800">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        공포 &amp; 탐욕
      </h2>

      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 120 70" className="w-full max-w-[140px]">
          {/* Background arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#374151"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Colored progress arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
          />
          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="3" fill="white" />
          {/* Value text */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            {clamp}
          </text>
        </svg>

        <span className="text-sm font-semibold" style={{ color }}>
          {korLabel}
        </span>
        <span className="text-xs text-gray-500">{classification}</span>
      </div>
    </div>
  )
}
