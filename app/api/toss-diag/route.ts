import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 임시 진단용
// 1) ?token=<로컬발급토큰> 전달 시 → 그 토큰으로 prices 호출 (API 호출이 IP 제한인지 확인)
// 2) 미전달 시 → Vercel 에서 토큰 발급 시도 (토큰 발급이 IP 제한인지 확인)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  // ── 케이스 1: 전달된 토큰으로 prices 호출 ──
  if (token) {
    let priceStatus: string | number = 'skip'
    let priceBody: string | null = null
    try {
      const res = await fetch(
        'https://openapi.tossinvest.com/api/v1/prices?symbols=005930',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      priceStatus = res.status
      priceBody = (await res.text()).slice(0, 200)
    } catch (e) {
      priceStatus = 'fetch-error'
      priceBody = e instanceof Error ? e.message : String(e)
    }
    return NextResponse.json({ mode: 'price-with-token', priceStatus, priceBody })
  }

  // ── 케이스 2: Vercel 에서 토큰 발급 시도 ──
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

  return NextResponse.json({ mode: 'issue-token', hasKey, hasSecret, keyPrefix, tokenStatus, tokenError })
}
