import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 임시 디버그 엔드포인트 — HTML 원문 확인용
export async function GET() {
  const url = 'https://finance.naver.com/news/newslist.naver?category=%EC%8B%9C%ED%99%A9%EC%86%8D%EB%B3%B4'
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Referer:         'https://finance.naver.com/news/',
      },
      cache: 'no-store',
    })

    const buf      = await res.arrayBuffer()
    const htmlEuc  = (() => { try { return new TextDecoder('euc-kr').decode(buf) } catch { return '' } })()
    const htmlUtf  = new TextDecoder('utf-8', { fatal: false }).decode(buf)

    // 두 가지 디코딩 첫 4000자 + newsRead 링크 발견 여부
    const eucLinks   = (htmlEuc.match(/newsRead\.naver/g) ?? []).length
    const utfLinks   = (htmlUtf.match(/newsRead\.naver/g) ?? []).length

    return NextResponse.json({
      status:      res.status,
      finalUrl:    res.url,
      eucLinks,
      utfLinks,
      eucSample:   htmlEuc.slice(0, 4000),
      utfSample:   htmlUtf.slice(0, 4000),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
