import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    clientId:     process.env.GMAIL_CLIENT_ID?.slice(0, 20) + '...',
    clientSecret: process.env.GMAIL_CLIENT_SECRET?.slice(0, 10) + '...',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN?.slice(0, 10) + '...',
    supabaseUrl:  process.env.NEXT_PUBLIC_SUPABASE_URL,
  })
}
