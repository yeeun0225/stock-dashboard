import { revalidatePath } from 'next/cache'
import { NextResponse }    from 'next/server'

export const dynamic = 'force-dynamic'

// Vercel Cron이 매일 09:00 KST (00:00 UTC)에 이 엔드포인트를 호출
// → /api/research 캐시 무효화 → 첫 접근 시 Naver에서 신선한 데이터 fetch
export async function GET(request: Request) {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 자동으로 첨부
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // /api/research 전체 경로(모든 쿼리 파라미터 변형 포함) 캐시 무효화
  revalidatePath('/api/research')

  // 가장 많이 쓰이는 page=1 캐시를 즉시 워밍
  try {
    const host  = request.headers.get('host') ?? ''
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    await fetch(
      `${proto}://${host}/api/research?page=1&afterDate=2026-01-01`,
      { cache: 'no-store' },
    )
  } catch {
    // 워밍 실패 시에도 다음 사용자 접근 때 재fetch되므로 무시
  }

  return NextResponse.json({
    ok:          true,
    revalidated: '/api/research',
    at:          new Date().toISOString(),
  })
}
