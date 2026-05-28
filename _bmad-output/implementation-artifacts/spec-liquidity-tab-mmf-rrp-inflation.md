---
title: '유동성 탭 — MMF·TIPS·RRP·SOFR·인플레이션 히트맵 섹션 추가'
type: 'feature'
created: '2026-05-28'
status: 'done'
baseline_commit: '556af90ca486ce3279e3da459c0ae83970ef7a63'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 유동성&시장 탭에 국채 수익률·원자재 외에 MMF 자금흐름, 단기 유동성(RRP/SOFR), 인플레이션 지표가 없어 매크로 유동성 전체 그림을 한 화면에서 파악하기 어렵다.

**Approach:** FRED API 기반 3개 신규 API 라우트를 추가하고, 기존 `app/liquidity/page.tsx`에 해당 3개 섹션을 삽입한다. `/api/mmf-tips` 라우트는 이미 완성되어 있으므로 UI 연결만 하면 된다.

## Boundaries & Constraints

**Always:**
- FRED API 키는 `process.env.FRED_API_KEY` 사용 (이미 설정됨)
- `export const dynamic = 'force-dynamic'` 필수
- `Promise.allSettled` 사용 — 부분 실패 허용
- `'Cache-Control': 'no-store'` 응답 헤더 포함
- 기존 5분 인터벌 자동새로고침 사이클에 신규 fetch 3개 포함

**Ask First:**
- 인플레이션 히트맵 기간(현재 6개월) 변경 요구 시

**Never:**
- NY Fed API 직접 호출 (FRED로 대체)
- 기존 수익률 곡선·원자재 섹션 수정
- 새 패키지 설치

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| FRED 정상 | WRMFNS 14건 반환 | MMF current/change1w/change4w/history 계산됨 | — |
| FRED 값 없음 (`.`) | obs.value === '.' | 해당 관측값 필터링, 나머지로 계산 | mmf: null 반환 |
| FRED 관측 2건 미만 | length < 2 | mmf: null | 섹션 "데이터 없음" 표시 |
| 인플레이션 월별 12개 이전 없음 | obs[i+12] 없음 | 해당 월 셀 제외 | 빈 cells 배열 |
| RRP/SOFR 65건 요청 | 일부 주말 제외 | 최대 60개 히스토리 반환 | toSeries → null |

</frozen-after-approval>

## Code Map

- `app/api/mmf-tips/route.ts` -- 완성됨. MmfTipsData 인터페이스 export. WRMFNS·DFII5·DFII10
- `app/api/liquidity-flow/route.ts` -- 신규. FRED RRPONTSYD·SOFR 60일 히스토리
- `app/api/inflation/route.ts` -- 신규. CPIAUCSL·CPILFESL·WPSFD49207·PCEPI·PCEPILFE·CES0500000003 YoY 6개월
- `app/liquidity/page.tsx` -- 기존. 3개 섹션 추가: MMF+TIPS, RRP+SOFR, 인플레이션 히트맵

## Tasks & Acceptance

**Execution:**

- [x] `app/api/liquidity-flow/route.ts` -- CREATE -- FRED RRPONTSYD(ON RRP 잔액, 십억$) + SOFR(%) 각각 65건 desc 조회 → 60일 히스토리(oldest→newest) + current + change1d. 인터페이스: `FlowSeries { current, change1d, history: LiqFlowPoint[], date }`, `LiquidityFlowData { rrp, sofr, timestamp }`

- [x] `app/api/inflation/route.ts` -- CREATE -- 6개 FRED 월별 시리즈를 `Promise.allSettled`로 동시 조회(각 20건), YoY 6개월 계산(`(obs[i] / obs[i+12] - 1) * 100`, oldest→newest로 reverse). 인터페이스: `InflationCell { date, yoy }`, `InflationRow { id, label, emoji, cells, latest, trend }`, `InflationData { rows, timestamp }`
  - 시리즈 목록: CPIAUCSL(🛒헤드라인 CPI), CPILFESL(🔧근원 CPI), WPSFD49207(🏭PPI 최종수요), PCEPI(💳PCE), PCEPILFE(📊근원 PCE), CES0500000003(💰평균 시간급)

- [x] `app/liquidity/page.tsx` -- UPDATE -- 다음 3개 섹션 추가 + 5분 인터벌에 3개 fetch 통합:
  1. **MMF·TIPS 섹션**: 2컬럼 레이아웃 — 좌: MMF 총자산(조$) + 1W/4W 변화 + 12주 스파크라인, 우: 5Y·10Y TIPS 실질금리 수치 + 전일 변화 badge + 실질금리 수준 해설 (>2%→빨강, >0%→노랑, ≤0%→초록)
  2. **RRP·SOFR 섹션**: 2컬럼 레이아웃 — 각각 현재값 + 전일 변화 + 60일 스파크라인 + 1줄 해설
  3. **인플레이션 히트맵 섹션**: `<table>` 기반 6행(지표)×6열(월) 셀 — YoY % 표시, `yoyColor()` 함수로 배경색 지정 (0%미만→blue, 0~1.5%→cyan, 1.5~2.5%→emerald, 2.5~3.5%→yellow, 3.5~5%→orange, 5%+→red), 최신 열 bold, 상단 컬러 범례
  - `MiniSparkline` 헬퍼 컴포넌트 (SVG polyline, 색상 prop)
  - `formatMonth(dateStr)` 헬퍼: `"2025-01-01"` → `"25.1"`

## Design Notes

**fredDesc 패턴** (기존 mmf-tips와 동일):
```ts
async function fredDesc(series: string, limit: number): Promise<any[]> {
  const url = `${BASE}?series_id=${series}&api_key=${FRED_KEY}&sort_order=desc&limit=${limit}&file_type=json`
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()
  return (data.observations as any[]).filter(o => o.value !== '.')
}
```

**YoY 계산** — FRED desc 정렬 기준:
```ts
// obs[0]=최신월, obs[12]=12개월전
for (let i = 0; i < 6; i++) {
  results.push({ date: obs[i].date, yoy: (parseFloat(obs[i].value) / parseFloat(obs[i+12].value) - 1) * 100 })
}
return results.reverse()  // oldest→newest
```

**yoyColor** 색상 등급 (Tailwind inline class 문자열 반환):
- `< 0` → `bg-blue-500/30 text-blue-200`
- `0–1.5` → `bg-cyan-500/20 text-cyan-300`
- `1.5–2.5` → `bg-emerald-500/25 text-emerald-200`
- `2.5–3.5` → `bg-yellow-500/20 text-yellow-300`
- `3.5–5` → `bg-orange-500/25 text-orange-300`
- `5+` → `bg-red-500/30 text-red-300`

## Verification

**Commands:**
- `cd C:\Users\USER\_bmad\stock-dashboard && npx tsc --noEmit` -- expected: 0 errors

**Manual checks:**
- `/liquidity` 페이지 로딩 후 3개 신규 섹션이 기존 섹션 아래에 순서대로 표시됨
- MMF 총자산 수치가 수조 단위($6~7조)로 표시됨
- 인플레이션 히트맵 셀에 색상이 적용됨 (CPI ~3% → yellow 계열)
- 5분 후 자동 새로고침 시 3개 섹션도 함께 갱신됨

## Suggested Review Order

**Data Pipeline — API Routes**

- Entry point: `Promise.allSettled` + `?? []` null guard pattern; partial FRED failure survives
  [`liquidity-flow/route.ts:35`](../../app/api/liquidity-flow/route.ts#L35)

- `toSeries` helper: desc→history reverse, change1d calculation
  [`liquidity-flow/route.ts:41`](../../app/api/liquidity-flow/route.ts#L41)

- `computeYoY`: desc-ordered obs[i] vs obs[i+12] YoY with early-break guard
  [`inflation/route.ts:19`](../../app/api/inflation/route.ts#L19)

- 6개 FRED 시리즈 목록 + limit 25 (buffer for `.` filtered obs)
  [`inflation/route.ts:48`](../../app/api/inflation/route.ts#L48)

**UI — Loading & Data Fetch**

- `loadAll` inside `useEffect` — avoids stale closure; `safeJson` r.ok gate
  [`page.tsx:228`](../../app/liquidity/page.tsx#L228)

**UI — Reusable Helpers**

- `MiniSparkline` SVG: polyline + translucent area fill, length < 2 guard
  [`page.tsx:107`](../../app/liquidity/page.tsx#L107)

- `yoyColor`: 6-tier Tailwind class mapping for heatmap cells
  [`page.tsx:127`](../../app/liquidity/page.tsx#L127)

- `FlowPanel`: reusable RRP/SOFR panel with `invertChangeColor` prop
  [`page.tsx:163`](../../app/liquidity/page.tsx#L163)

**UI — New Sections**

- MMF 총자산(조$) + 1W/4W change + sparkline / TIPS 실질금리 badge + signal
  [`page.tsx:312`](../../app/liquidity/page.tsx#L312)

- RRP + SOFR FlowPanel grid
  [`page.tsx:367`](../../app/liquidity/page.tsx#L367)

- 인플레이션 히트맵: `inflHeaderRow` from first non-empty row; `inflColCount` dynamic colSpan
  [`page.tsx:396`](../../app/liquidity/page.tsx#L396)

## Spec Change Log

### Loop 1 — 2026-05-28

**Triggering finding (bad_spec):** `liquidity-flow/route.ts`가 `Promise.all`을 사용해 한 FRED 호출 실패 시 전체 엔드포인트가 500 반환. 스펙 Boundaries에 `Promise.allSettled 사용 — 부분 실패 허용` 명시 위반.

**Amendment:** `liquidity-flow/route.ts` 태스크 설명에 `Promise.allSettled` 사용 명시 추가.

**Known-bad state avoided:** `Promise.all` + 한 쪽 FRED 실패 → `rrp: null, sofr: null` 대신 500 반환.

**KEEP (잘 동작한 것):** `toSeries` 헬퍼 패턴, `FlowSeries` 인터페이스, history oldest→newest reverse, `FlowPanel` 컴포넌트 재사용, MiniSparkline SVG, yoyColor 등급, formatMonth string split 방식.

**Patches also applied:** `data.observations ?? []` null 가드, inflation limit 25로 증가, thead 빈 셀 보호, colSpan 동적 계산, loadAll을 useEffect 내부로 이동, `r.ok` 체크, `rows.some()` 조건 추가.
