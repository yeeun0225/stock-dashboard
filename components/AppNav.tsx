'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/',              label: 'HOME' },
  { href: '/macro',         label: '거시경제 모니터' },
  { href: '/liquidity',     label: '유동성&시장' },
  { href: '/real-economy',  label: '실물경제' },
  { href: '/news',          label: '리서치' },
  { href: '/cards',         label: '관심종목' },
  { href: '/study',         label: '공부' },
]

export default function AppNav() {
  const path = usePathname()

  return (
    <nav className="sticky top-0 z-30 bg-gray-950 border-b border-gray-800">
      <div className="flex overflow-x-auto scrollbar-hide px-2 gap-0.5">
        {TABS.map((t) => {
          const active = path === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`shrink-0 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                active
                  ? 'text-white border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
