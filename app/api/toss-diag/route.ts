import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 임시 진단용 — 시크릿은 노출하지 않고 env 반영/토큰 발급 가능 여부만 확인
export async function GET() {
  const hasKey = !!process.env.TOSS_API_KEY
  const hasSecret = !!process.env.TOSS_SECRET_KEY
  const keyPrefix = process.env.TOSS_API_KEY?.slice(0, 9) ?? null

  let tokenStatus: string | number = 'skip'
  let tokenError: string | null = null
  if (hasKey && hasSecret) {
    try {
      const res = await fetch('https://openapi.tossinvest.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.TOSS_API_KEY!,
          client_secret: process.env.TOSS_SECRET_KEY!,
        }),
      })
      tokenStatus = res.status
      if (!res.ok) tokenError = (await res.text()).slice(0, 200)
    } catch (e) {
      tokenStatus = 'fetch-error'
      tokenError = e instanceof Error ? e.message : String(e)
    }
  }

  return NextResponse.json({ hasKey, hasSecret, keyPrefix, tokenStatus, tokenError })
}
