import ZoneCard from './ZoneCard'
import FearGreedGauge from './FearGreedGauge'
import FinvizHeatmap from './FinvizHeatmap'
import { formatPrice, formatPercent } from '@/lib/market-utils'
import type { MarketData, FearGreedData, ZoneItem } from '@/lib/types'

interface Props {
  market: MarketData | null
  fearGreed: FearGreedData | null
}

function makeItems(
  entries: { label: string; q: { price: number; changePercent: number; symbol: string } }[]
): ZoneItem[] {
  return entries.map(({ label, q }) => ({
    label,
    value: formatPrice(q.price, q.symbol),
    changePercent: q.changePercent,
  }))
}

export default function MacroGrid({ market, fearGreed }: Props) {
  const m = market

  const indicesItems: ZoneItem[] = m
    ? makeItems([
        { label: '코스피', q: { ...m.indices.kospi, symbol: '^KS11' } },
        { label: '코스닥', q: { ...m.indices.kosdaq, symbol: '^KQ11' } },
      ])
    : []

  const usIndicesItems: ZoneItem[] = m
    ? makeItems([
        { label: '나스닥', q: { ...m.indices.nasdaq, symbol: '^IXIC' } },
        { label: 'S&P 500', q: { ...m.indices.sp500, symbol: '^GSPC' } },
        { label: '다우', q: { ...m.indices.dow, symbol: '^DJI' } },
      ])
    : []

  const fxItems: ZoneItem[] = m
    ? makeItems([
        { label: 'USD/KRW', q: { ...m.fx.usdkrw, symbol: 'USDKRW=X' } },
        { label: 'JPY/KRW', q: { ...m.fx.jpykrw, symbol: 'JPYKRW=X' } },
        { label: 'CNY/KRW', q: { ...m.fx.cnykrw, symbol: 'CNYKRW=X' } },
      ])
    : []

  const commodityItems: ZoneItem[] = m
    ? makeItems([
        { label: '금 (GC)', q: { ...m.commodities.gold, symbol: 'GC=F' } },
        { label: '은 (SI)', q: { ...m.commodities.silver, symbol: 'SI=F' } },
        { label: '구리 (HG)', q: { ...m.commodities.copper, symbol: 'HG=F' } },
      ])
    : []

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <ZoneCard title="한국 지수" items={indicesItems} loading={!m} />
      <ZoneCard title="미국 지수" items={usIndicesItems} loading={!m} />
      <ZoneCard title="환율" items={fxItems} loading={!m} />
      <ZoneCard title="원자재" items={commodityItems} loading={!m} />
      {fearGreed ? (
        <FearGreedGauge
          value={fearGreed.value}
          classification={fearGreed.classification}
        />
      ) : (
        <ZoneCard title="공포 &amp; 탐욕" items={[]} loading={true} />
      )}
      <FinvizHeatmap />
    </div>
  )
}
