'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useAuth() {
  // undefined = 초기 로딩 중, null = 비로그인, User = 로그인됨
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })

    // 로그인/로그아웃 실시간 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => { setUser(session?.user ?? null) }
    )
    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    loading: user === undefined,
    signOut: () => supabase.auth.signOut(),
  }
}
