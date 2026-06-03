import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId     = process.env.GMAIL_CLIENT_ID ?? ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET ?? ''
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN ?? ''

  // 실제 토큰 요청 테스트
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId.trim(),
      client_secret: clientSecret.trim(),
      refresh_token: refreshToken.trim(),
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()

  return NextResponse.json({
    clientIdLength:     clientId.length,
    clientSecretLength: clientSecret.length,
    refreshTokenLength: refreshToken.length,
    clientIdPreview:    clientId.slice(0, 25),
    tokenResponse:      data,
  })
}
