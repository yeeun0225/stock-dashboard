import { Suspense } from 'react'
import Header from '@/components/Header'
import MacroGrid from '@/components/MacroGrid'
import AutoRefresh from '@/components/AutoRefresh'
import { fetchMarketData, fetchFearGreedData } from '@/lib/market-data'

async function Dashboard() {
  const [market, fearGreed] = await Promise.all([
    fetchMarketData(),
    fetchFearGreedData(),
  ])

  return (
    <>
      <Header market={market} />
      <main className="flex-1 px-3 py-4 max-w-4xl mx-auto w-full">
        <MacroGrid market={market} fearGreed={fearGreed} />
      </main>
    </>
  )
}

export default function Page() {
  return (
    <>
      <AutoRefresh />
      <Suspense
        fallback={
          <>
            <Header market={null} />
            <main className="flex-1 px-3 py-4 max-w-4xl mx-auto w-full">
              <MacroGrid market={null} fearGreed={null} />
            </main>
          </>
        }
      >
        <Dashboard />
      </Suspense>
    </>
  )
}
