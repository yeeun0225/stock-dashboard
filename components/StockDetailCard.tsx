'use client'

import { useEffect, useState, useCallback } from 'react'
import type { InvestorData } from '@/app/api/kr-investor/route'
import SignalPicker from './SignalPicker'
import NoteEditor from './NoteEditor'
import NoteCard from './NoteCard'
import { type Note, loadNotes } from '@/lib/notes'

export interface ExtendedQuote {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
  volume: number
  open: number
  high: number
  low: number
  prevClose: number
  avgVolume: number
  marketCap: number | null
  pe: number | null
  week52High: number | null
  week52Low: number | null
}

function isKrTicker(ticker: string) {
  return /\.(KS|KQ)$/i.test(ticker)
}

function formatPrice(price: number, currency: string): string {
  if (!price) return '—'
  if (currency === 'KRW') return price.toLocaleString('ko-KR') + '원'
  if (currency === 'JPY') return '¥' + price.toLocaleString()
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatVolume(v: number): string {
  if (!v) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return v.toLocaleString()
}

function formatMarketCap(v: number | null, currency: string): string {
  if (!v) return '—'
  if (currency === 'KRW') {
    if (v >= 1e12) return (v / 1e12).toFixed(1) + '조'
    if (v >= 1e8) return (v / 1e8).toFixed(0) + '억'
    return v.toLocaleString() + '원'
  }
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T'
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(0) + 'M'
  return '$' + v.toLocaleString()
}

function formatInvAmt(v: number): string {
  if (!v && v !== 0) return '—'
  const abs = Math.abs(v)
  let s = ''
  if (abs >= 1e12) s = (abs / 1e12).toFixed(1) + '조'
  else if (abs >= 1e8) s = (abs / 1e8).toFixed(0) + '억'
  else if (abs >= 1e4) s = (abs / 1e4).toFixed(0) + '만'
  else s = abs.toLocaleString()
  return (v >= 0 ? '+' : '-') + s
}

function InvestorRow({
  label,
  data,
}: {
  label: string
  data: { buy: number; sell: number; net: number }
}) {
  const netColor = data.net >= 0 ? 'text-green-400' : 'text-red-400'
  return (
    <div className="grid grid-cols-4 gap-1 text-xs py-1 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-blue-400 text-right tabular-nums">{formatInvAmt(data.buy)}</span>
      <span className="text-red-400 text-right tabular-nums">{formatInvAmt(-data.sell)}</span>
      <span className={`${netColor} text-right font-semibold tabular-nums`}>{formatInvAmt(data.net)}</span>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 tabular-nums">{value}</span>
    </div>
  )
}

export default function StockDetailCard({ quote, onRemove }: { quote: ExtendedQuote; onRemove?: () => void }) {
  const [investor, setInvestor] = useState<InvestorData | null>(null)
  const [invLoading, setInvLoading] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const isKr = isKrTicker(quote.ticker)

  const refreshNotes = useCallback(() => {
    setNotes(loadNotes().filter((n) => n.ticker === quote.ticker))
  }, [quote.ticker])

  useEffect(() => { refreshNotes() }, [refreshNotes])

  useEffect(() => {
    if (!isKr) return
    setInvLoading(true)
    fetch(`/api/kr-investor?ticker=${quote.ticker}`)
      .then((r) => r.json())
      .then(setInvestor)
      .catch(() => {})
      .finally(() => setInvLoading(false))
  }, [quote.ticker, isKr])

  const pctColor = quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
  const pctSign = quote.changePercent >= 0 ? '+' : ''
  const market = quote.ticker.endsWith('.KS')
    ? 'KOSPI'
    : quote.ticker.endsWith('.KQ')
    ? 'KOSDAQ'
    : quote.ticker.endsWith('.T')
    ? 'TSE'
    : 'NASDAQ/NYSE'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white truncate">{quote.name}</h3>
            <span className="text-xs text-gray-600 bg-gray-800 rounded px-1.5 py-0.5 shrink-0">{market}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{quote.ticker}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SignalPicker ticker={quote.ticker} />
          {onRemove && (
            <button
              onClick={onRemove}
              data-html2canvas-ignore="true"
              className="text-gray-700 hover:text-red-400 transition-colors text-lg leading-none"
              title="삭제"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white tabular-nums">
          {formatPrice(quote.price, quote.currency)}
        </span>
        <span className={`text-sm font-semibold tabular-nums mb-0.5 ${pctColor}`}>
          {pctSign}{quote.changePercent.toFixed(2)}%
        </span>
        <span className={`text-xs tabular-nums mb-0.5 ${pctColor}`}>
          ({pctSign}{formatPrice(quote.change, quote.currency)})
        </span>
      </div>

      {/* OHLC + 거래량 */}
      <div className="bg-gray-800 rounded-lg px-3 py-2 flex flex-col gap-0.5">
        <div className="grid grid-cols-2 gap-x-4">
          <DataRow label="시가" value={formatPrice(quote.open, quote.currency)} />
          <DataRow label="고가" value={formatPrice(quote.high, quote.currency)} />
          <DataRow label="저가" value={formatPrice(quote.low, quote.currency)} />
          <DataRow label="전일종가" value={formatPrice(quote.prevClose, quote.currency)} />
        </div>
        <div className="border-t border-gray-700 mt-1 pt-1 grid grid-cols-2 gap-x-4">
          <DataRow label="거래량" value={formatVolume(quote.volume)} />
          <DataRow label="평균거래량" value={formatVolume(quote.avgVolume)} />
          <DataRow label="시가총액" value={formatMarketCap(quote.marketCap, quote.currency)} />
          <DataRow label="PER" value={quote.pe ? quote.pe.toFixed(1) + 'x' : '—'} />
          <DataRow label="52주 최고" value={formatPrice(quote.week52High ?? 0, quote.currency)} />
          <DataRow label="52주 최저" value={formatPrice(quote.week52Low ?? 0, quote.currency)} />
        </div>
      </div>

      {/* 투자자별 순매수 — KR stocks only */}
      {isKr && (
        <div className="bg-gray-800 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">투자자별 순매수</p>
            {invLoading && (
              <span className="text-xs text-gray-600 animate-pulse">로딩 중...</span>
            )}
            {investor?.date && (
              <span className="text-xs text-gray-600">{investor.date}</span>
            )}
          </div>
          {investor && !invLoading ? (
            <>
              <div className="grid grid-cols-4 gap-1 text-xs mb-1">
                <span className="text-gray-600"></span>
                <span className="text-gray-600 text-right">매수</span>
                <span className="text-gray-600 text-right">매도</span>
                <span className="text-gray-600 text-right font-medium">순매수</span>
              </div>
              <InvestorRow label="기관" data={investor.institution} />
              <InvestorRow label="외국인" data={investor.foreign} />
              <InvestorRow label="개인" data={investor.individual} />
              <InvestorRow label="연기금" data={investor.pension} />
            </>
          ) : !invLoading ? (
            <p className="text-xs text-gray-600 text-center py-2">데이터를 불러오지 못했습니다</p>
          ) : null}
        </div>
      )}

      {/* 메모 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">메모</p>
          <button
            onClick={() => setShowNoteEditor(true)}
            data-html2canvas-ignore="true"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            + 추가
          </button>
        </div>
        {notes.length === 0 ? (
          <button
            onClick={() => setShowNoteEditor(true)}
            data-html2canvas-ignore="true"
            className="text-xs text-gray-600 hover:text-gray-400 text-center py-3 border border-dashed border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
          >
            메모를 추가해보세요
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} onChange={refreshNotes} />
            ))}
          </div>
        )}
      </div>

      {showNoteEditor && (
        <NoteEditor
          initial={{ type: 'stock', ticker: quote.ticker, stockName: quote.name }}
          onSave={() => { setShowNoteEditor(false); refreshNotes() }}
          onClose={() => setShowNoteEditor(false)}
        />
      )}
    </div>
  )
}
