'use client'

import { useEffect, useRef, useState } from 'react'
import { type Signal, SIGNAL_CONFIG, SIGNAL_LIST, loadSignals, saveSignal } from '@/lib/signals'

interface Props {
  ticker: string
}

export default function SignalPicker({ ticker }: Props) {
  const [signal, setSignal] = useState<Signal | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Load from localStorage
  useEffect(() => {
    setSignal(loadSignals()[ticker] ?? null)
  }, [ticker])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const select = (s: Signal | null) => {
    saveSignal(ticker, s)
    setSignal(s)
    setOpen(false)
  }

  const cfg = signal ? SIGNAL_CONFIG[signal] : null

  return (
    <div ref={ref} className="relative">
      {/* Current signal badge / trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-all ${
          cfg
            ? `${cfg.bg} ${cfg.text} ${cfg.ring}`
            : 'bg-gray-800 text-gray-500 ring-gray-700 hover:ring-gray-500'
        }`}
      >
        {cfg ? (
          <>
            <span>{cfg.dot}</span>
            <span>{cfg.label}</span>
          </>
        ) : (
          <span>신호 없음</span>
        )}
      </button>

      {/* Picker dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-2 flex flex-col gap-1 min-w-[100px]">
          {SIGNAL_LIST.map(([key, c]) => (
            <button
              key={key}
              onClick={() => select(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                signal === key
                  ? `${c.bg} ${c.text} ring-1 ${c.ring}`
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{c.dot}</span>
              <span>{c.label}</span>
            </button>
          ))}
          {signal && (
            <>
              <div className="border-t border-gray-700 my-0.5" />
              <button
                onClick={() => select(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-colors"
              >
                <span>✕</span>
                <span>해제</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
