# Deferred Work

## From: liquidity-tab-mmf-rrp-inflation (2026-05-28)

- **fetch timeout**: `fredDesc`에 `AbortSignal.timeout(8000)` 추가. 현재 FRED 호출이 hang 시 서버리스 함수 전체 타임아웃까지 블록됨.
- **fredDesc 중복**: `app/api/liquidity-flow/route.ts`와 `app/api/inflation/route.ts`에 동일한 `fredDesc` 함수가 중복. `lib/fred.ts`로 추출하여 공유.
- **any[] 타입**: FRED 응답을 `FredObs { date: string; value: string }` 인터페이스로 타입 안전하게 정의.
