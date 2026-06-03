import { NextResponse } from 'next/server'
import { fetchNewEmails } from '@/lib/gmail'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Vercel cron + 수동 호출 모두 지원
export async function GET(req: Request) {
  // cron secret 체크 (선택)
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 최근 7일치만 가져오기
    const after = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)
    const emails = await fetchNewEmails(String(after))

    let inserted = 0
    for (const email of emails) {
      const { error } = await supabaseAdmin
        .from('money_letters')
        .upsert(
          {
            gmail_id:    email.gmailId,
            sender:      email.sender,
            subject:     email.subject,
            content:     email.content,
            received_at: email.receivedAt,
          },
          { onConflict: 'gmail_id' }
        )
      if (!error) inserted++
    }

    return NextResponse.json({ ok: true, fetched: emails.length, inserted })
  } catch (err) {
    console.error('[fetch-letters]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
