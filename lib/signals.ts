export type Signal = 'buy' | 'hold' | 'watch' | 'sell'

export const SIGNAL_CONFIG: Record<Signal, { label: string; dot: string; text: string; ring: string; bg: string }> = {
  buy:   { label: '매수', dot: '🟢', text: 'text-green-400',  ring: 'ring-green-500',  bg: 'bg-green-500/15' },
  hold:  { label: '홀드', dot: '🔵', text: 'text-blue-400',   ring: 'ring-blue-500',   bg: 'bg-blue-500/15'  },
  watch: { label: '관망', dot: '🟡', text: 'text-yellow-400', ring: 'ring-yellow-500', bg: 'bg-yellow-500/15' },
  sell:  { label: '매도', dot: '🔴', text: 'text-red-400',    ring: 'ring-red-500',    bg: 'bg-red-500/15'   },
}

export const SIGNAL_LIST = Object.entries(SIGNAL_CONFIG) as [Signal, (typeof SIGNAL_CONFIG)[Signal]][]

const KEY = 'mlm-signals'

export function loadSignals(): Record<string, Signal> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveSignal(ticker: string, signal: Signal | null) {
  const all = loadSignals()
  if (signal === null) delete all[ticker]
  else all[ticker] = signal
  localStorage.setItem(KEY, JSON.stringify(all))
}
