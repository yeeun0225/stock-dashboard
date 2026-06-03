import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '0225'

// GET: 전체 조회 (공개)
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data, error } = await supabase
    .from('reference_notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: 추가 (비밀번호 필요)
export async function POST(req: Request) {
  const body = await req.json()
  const { password, ticker, stockName, sectors, content, newsLink } = body

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸어요' }, { status: 401 })
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('reference_notes')
    .insert({
      ticker:     ticker || null,
      stock_name: stockName || null,
      sectors:    sectors ?? [],
      content:    content.trim(),
      news_link:  newsLink || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: 삭제 (비밀번호 필요)
export async function DELETE(req: Request) {
  const body = await req.json()
  const { password, id } = body

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸어요' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('reference_notes')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
