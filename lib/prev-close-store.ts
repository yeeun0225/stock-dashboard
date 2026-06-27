/**
 * 전일종가 공용 저장소 (Supabase)
 *
 * serverless 인스턴스 간 캐시 공유를 위해 전일종가를 DB에 저장한다.
 * cron 이 하루 1회 candles 로 받아 저장 → 사용자 요청은 DB 에서 즉시 로드.
 *
 * 필요한 테이블 SQL (Supabase 대시보드 > SQL Editor):
 *
 * create table prev_closes (
 *   symbol text primary key,
 *   prev_close numeric not null,
 *   trade_date text not null,
 *   updated_at timestamptz default now()
 * );
 * -- 공용 참조 데이터(사용자별 아님). 서버(service role)만 읽고 쓰므로 RLS 비활성.
 *
 * env(Supabase) 가 없는 로컬에서는 모든 함수가 graceful 하게 빈 결과/무동작 처리되어
 * 호출측이 candles 폴백을 타도록 한다.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// env 가 없으면 null 을 반환하여 호출측이 candles 폴백을 타도록 한다.
// (supabase.ts 의 최상위 createClient 는 env 없을 때 throw 하므로 직접 lazy 생성)
function admin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    return createClient(url, key)
  } catch {
    return null
  }
}

// 특정 trade_date 의 전일종가 전체를 로드 (symbol → prevClose)
export async function loadPrevCloses(tradeDate: string): Promise<Map<string, number>> {
  try {
    const sb = admin()
    if (!sb) return new Map()
    const { data, error } = await sb
      .from('prev_closes')
      .select('symbol, prev_close')
      .eq('trade_date', tradeDate)
    if (error || !data) return new Map()
    return new Map(data.map((r) => [r.symbol as string, Number(r.prev_close)]))
  } catch {
    return new Map()
  }
}

// 전일종가 upsert (0 이하 값은 저장하지 않음)
export async function savePrevCloses(
  map: Map<string, number>,
  tradeDate: string
): Promise<void> {
  if (map.size === 0) return
  try {
    const sb = admin()
    if (!sb) return
    const now = new Date().toISOString()
    const rows = [...map]
      .filter(([, v]) => v > 0)
      .map(([symbol, prev_close]) => ({ symbol, prev_close, trade_date: tradeDate, updated_at: now }))
    if (rows.length === 0) return
    await sb.from('prev_closes').upsert(rows, { onConflict: 'symbol' })
  } catch {
    // env 없음 / 네트워크 오류 — 무시 (candles 폴백으로 동작)
  }
}
