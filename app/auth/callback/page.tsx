'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackInner() {
  const router      = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(() => router.replace(next))
        .catch(() => router.replace('/'))
    } else {
      router.replace('/')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">로그인 처리 중...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">로그인 처리 중...</p>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  )
}
