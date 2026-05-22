import type { WeatherInfo } from './types'

export function formatPrice(price: number, symbol: string): string {
  if (!price || isNaN(price)) return '—'
  if (symbol.includes('KRW')) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function formatPercent(pct: number): string {
  if (pct === undefined || isNaN(pct)) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

export function getChangeColor(pct: number): string {
  if (pct > 0) return 'text-green-400'
  if (pct < 0) return 'text-red-400'
  return 'text-gray-400'
}

export function calcWeather(
  nasdaqPct: number,
  sp500Pct: number,
  kospiPct: number
): WeatherInfo {
  const avg = (nasdaqPct + sp500Pct + kospiPct) / 3
  const maxAbs = Math.max(
    Math.abs(nasdaqPct),
    Math.abs(sp500Pct),
    Math.abs(kospiPct)
  )

  if (maxAbs > 2.0) {
    return { emoji: '⛈️', label: '변동성', description: '큰 변동성 주의' }
  }
  if (avg > 0.5) {
    return { emoji: '☀️', label: '강세', description: '전반적 상승 흐름' }
  }
  if (avg < -0.3) {
    return { emoji: '⛈️', label: '약세', description: '전반적 하락 흐름' }
  }
  return { emoji: '⛅', label: '혼조', description: '방향성 불명확' }
}

export function formatUpdateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
