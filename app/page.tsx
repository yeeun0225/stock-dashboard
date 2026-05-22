import { Suspense } from 'react'
import Header from '@/components/Header'
import MacroGrid from '@/components/MacroGrid'
import AutoRefresh from '@/components/AutoRefresh'
import type { MarketData, FearGreedData } from '@/lib/types'

async function fetchMarket(): Promise<MarketData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
    const res = await fetch(`${baseUrl}/api/market`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchFearGreed(): Promise<FearGreedData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
    const res = await fetch(`${baseUrl}/api/fear-greed`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function Dashboard() {
  const [market, fearGreed] = await Promise.all([
    fetchMarket(),
    fetchFearGreed(),
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
