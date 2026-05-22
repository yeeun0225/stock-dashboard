export interface QuoteData {
  symbol: string
  price: number
  change: number
  changePercent: number
  prevClose: number
}

export interface MarketData {
  indices: {
    kospi: QuoteData
    kosdaq: QuoteData
    nasdaq: QuoteData
    sp500: QuoteData
    dow: QuoteData
  }
  fx: {
    usdkrw: QuoteData
    jpykrw: QuoteData
    cnykrw: QuoteData
  }
  commodities: {
    gold: QuoteData
    silver: QuoteData
    copper: QuoteData
  }
  timestamp: number
}

export interface FearGreedData {
  value: number
  classification: string
  timestamp: number
}

export interface WeatherInfo {
  emoji: '☀️' | '⛅' | '⛈️' | '🌙'
  label: string
  description: string
}

export interface ZoneItem {
  label: string
  value: string
  changePercent: number
  sub?: string
}
