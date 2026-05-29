'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [router])

  return null
}
