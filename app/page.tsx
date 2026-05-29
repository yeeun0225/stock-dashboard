import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
import Header from '@/components/Header'
import MacroGrid from '@/components/MacroGrid'
import AutoRefresh from '@/components/AutoRefresh'
import Watchlist from '@/components/Watchlist'
import { fetchMarketData, fetchFearGreedData } from '@/lib/market-data'

async function Dashboard() {
  const [market, fearGreed] = await Promise.all([
    fetchMarketData(),
    fetchFearGreedData(),
  ])

  return (
    <>
      <Header market={market} />
      <main className="flex-1 px-3 py-4 w-full mx-auto max-w-4xl lg:max-w-6xl">
        <div className="flex gap-4 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <MacroGrid market={market} fearGreed={fearGreed} />
            {/* Watchlist below grid on mobile */}
            <div className="lg:hidden mt-4">
              <Watchlist />
            </div>
          </div>
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-16">
            <Watchlist />
          </aside>
        </div>
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
            <main className="flex-1 px-3 py-4 w-full mx-auto max-w-4xl lg:max-w-6xl">
              <div className="flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <MacroGrid market={null} fearGreed={null} />
                </div>
                <aside className="hidden lg:block w-72 shrink-0">
                  <Watchlist />
                </aside>
              </div>
            </main>
          </>
        }
      >
        <Dashboard />
      </Suspense>
    </>
  )
}
