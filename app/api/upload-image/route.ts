import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: '파일이 없어요' }, { status: 400 })

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 해요' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext    = file.name.split('.').pop() ?? 'jpg'
    const path   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const admin = getSupabaseAdmin()
    const { error } = await admin.storage
      .from('note-images')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = admin.storage
      .from('note-images')
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
