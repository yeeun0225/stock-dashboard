'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup'

interface Props {
  /** true = 전체 페이지 (MY탭), false = 섹션 내 (내 공모주) */
  fullPage?: boolean
}

export default function LoginScreen({ fullPage = true }: Props) {
  const [mode,     setMode]     = useState<Mode>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  const handleGoogle = async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError('Google 로그인 실패: ' + error.message); setLoading(false) }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); setError(null); setSuccess(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('로그인 실패: ' + error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError('가입 실패: ' + error.message)
      else setSuccess('이메일을 확인해 주세요! 인증 링크를 보냈어요 ✉️')
    }
    setLoading(false)
  }

  const inner = (
    <div className="w-full max-w-sm mx-auto">
      {fullPage && (
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white">💰 Money loves me</p>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            로그인하면 디바이스 간<br />데이터가 자동으로 동기화돼요
          </p>
        </div>
      )}

      {!fullPage && (
        <div className="text-center mb-6">
          <p className="text-base font-bold text-white">로그인이 필요해요</p>
          <p className="text-gray-500 text-xs mt-1">내 공모주 기록은 로그인 후 이용할 수 있어요</p>
        </div>
      )}

      {/* Google 로그인 */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 mb-5 text-sm"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Google로 계속하기
      </button>

      {/* 구분선 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-gray-600 text-xs">또는 이메일</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* 로그인 / 회원가입 탭 */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4">
        {(['login', 'signup'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setSuccess(null) }}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors font-medium ${
              mode === m ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {m === 'login' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      {/* 폼 */}
      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="이메일"
          required
          className="bg-gray-900 border border-gray-800 focus:border-blue-500 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          required
          className="bg-gray-900 border border-gray-800 focus:border-blue-500 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />

        {error   && <p className="text-red-400 text-xs text-center">{error}</p>}
        {success && <p className="text-emerald-400 text-xs text-center">{success}</p>}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
    </div>
  )

  if (!fullPage) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        {inner}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {inner}
    </div>
  )
}
