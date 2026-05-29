'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SubTab {
  label:      string
  href:       string
  matchPaths?: string[]   // 이 서브탭을 활성화할 추가 경로
}

interface NavGroup {
  label:       string
  href?:       string     // 직접 이동 (서브탭 없음)
  defaultHref?: string    // 그룹 클릭 시 이동할 기본 경로
  matchPaths:  string[]   // 이 그룹을 활성화할 경로들
  children?:   SubTab[]
}

const NAV: NavGroup[] = [
  {
    label:      'HOME',
    href:       '/',
    matchPaths: ['/'],
  },
  {
    label:       '모니터링',
    defaultHref: '/macro',
    matchPaths:  ['/macro', '/liquidity', '/real-economy'],
    children: [
      { label: '거시경제 모니터', href: '/macro' },
      { label: '유동성&시장',     href: '/liquidity' },
      { label: '실물경제',        href: '/real-economy' },
    ],
  },
  {
    label:       '종목 리서치',
    defaultHref: '/news',
    matchPaths:  ['/news', '/stock-news', '/research'],
    children: [
      { label: '리서치', href: '/news',        matchPaths: ['/news', '/research'] },
      { label: '뉴스',   href: '/stock-news' },
    ],
  },
  {
    label:      '공모주',
    href:       '/ipo',
    matchPaths: ['/ipo'],
  },
  {
    label:      '지식인',
    href:       '/knowledge',
    matchPaths: ['/knowledge'],
  },
  {
    label:       'MY',
    defaultHref: '/cards',
    matchPaths:  ['/cards', '/study'],
    children: [
      { label: '관심종목', href: '/cards' },
      { label: '공부',     href: '/study' },
    ],
  },
]

function isParentActive(group: NavGroup, path: string): boolean {
  return group.matchPaths.some(p =>
    p === '/' ? path === '/' : path === p || path.startsWith(p + '/'),
  )
}

function isChildActive(child: SubTab, path: string): boolean {
  return [child.href, ...(child.matchPaths ?? [])].some(
    p => path === p || path.startsWith(p + '/'),
  )
}

export default function AppNav() {
  const path = usePathname()
  const activeGroup = NAV.find(g => isParentActive(g, path))

  return (
    <nav className="sticky top-0 z-30 bg-gray-950 border-b border-gray-800">

      {/* ── 1단계: 메인 탭 ──────────────────────────────────── */}
      <div className="flex overflow-x-auto scrollbar-hide px-2 gap-0.5">
        {NAV.map(group => {
          const active = group === activeGroup
          const href   = group.href ?? group.defaultHref ?? '/'
          return (
            <Link
              key={group.label}
              href={href}
              className={`shrink-0 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                active
                  ? 'text-white border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {group.label}
            </Link>
          )
        })}
      </div>

      {/* ── 2단계: 서브 탭 (children 있을 때만) ───────────────── */}
      {activeGroup?.children && (
        <div className="flex overflow-x-auto scrollbar-hide px-3 gap-0.5 bg-gray-900/60 border-t border-gray-800/50">
          {activeGroup.children.map(child => {
            const active = isChildActive(child, path)
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  active
                    ? 'text-blue-400 border-blue-400'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}

    </nav>
  )
}
