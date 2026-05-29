'use client'

import { useEffect, useState } from 'react'

const INTERVAL = 5 * 60 // 300초

export default function RefreshBadge({ intervalSec = INTERVAL }: { intervalSec?: number }) {
  const [remaining, setRemaining] = useState(intervalSec)
  const [flash, setFlash]         = useState(false)

  useEffect(() => {
    setRemaining(intervalSec)

    const tick = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // 0이 되는 순간 플래시 후 리셋
          setFlash(true)
          setTimeout(() => setFlash(false), 1200)
          return intervalSec
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [intervalSec])

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60

  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors duration-500 ${
      flash ? 'text-blue-400' : 'text-gray-600'
    }`}>
      {/* 펄스 점 */}
      <span className={`w-1.5 h-1.5 rounded-full ${
        flash ? 'bg-blue-400 animate-ping' : 'bg-gray-700'
      }`} />
      {flash
        ? <span className="text-blue-400 font-semibold">업데이트 중...</span>
        : <span>{min}:{String(sec).padStart(2, '0')} 후 갱신</span>
      }
    </div>
  )
}
