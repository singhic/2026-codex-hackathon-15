# PostPick 프론트엔드 API 연동 가이드

이 문서는 `apps/web` 화면을 구현하는 프론트엔드 개발자가 현재 Route Handler와 Supabase 백엔드를 바로 연결하기 위한 계약서입니다. 브라우저에서 DB 테이블이나 `api` RPC를 직접 호출하지 않고, 포스터 파일 업로드를 제외한 도메인 작업은 같은 origin의 `/api/**` Route Handler를 사용합니다.

## 1. 현재 구현 범위와 시작 전 확인

현재 준비된 항목:

- `api`, `public`, `private` DB 스키마와 5개 migration
- Google 전용 Supabase Auth의 DB 방어 Hook
- 매장, A/B 테스트, 투표, 운영자 크레딧, 고객 보상 포인트, 정산 RPC
- 비공개 `test-posters` Storage와 RLS 정책
- 1분 주기 테스트 lifecycle Cron
- Next.js Route Handler와 생성된 `Database` 타입

현재 프론트엔드가 추가로 구현해야 하는 항목:

- `/login`, `/auth/callback`, 로그아웃과 세션 갱신 경계
- `/onboarding`, `/owner/**`, `/vote/[slug]`, `/me/**` 화면
- 화면별 로딩, 오류, 빈 상태, 폴링과 재시도 UX

운영 환경의 선행 조건:

1. Vercel에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`을 환경별로 등록합니다.
2. Supabase Auth Redirect URLs에 localhost callback, 정확한 Production callback, 필요한 Preview callback만 등록합니다.
3. 환경변수 변경 뒤 해당 Vercel 환경을 다시 배포합니다.
4. 운영자 크레딧 구매·관리자 지급 API는 아직 없습니다. 테스트 시작 E2E 검증에는 개발 DB에서 별도 크레딧 fixture가 필요합니다.

`SUPABASE_SERVICE_ROLE_KEY`는 프론트엔드와 Vercel 환경변수 계약에 추가하지 않습니다.

## 2. 호출 구조

```text
Browser / Server Component
  ├─ 도메인 데이터 ──> Next.js /api/** ──> api.* RPC ──> public/private tables
  └─ 포스터 파일 ────> Supabase Storage ──> storage.objects RLS
```

- 브라우저의 `fetch("/api/...")`는 Supabase 세션 쿠키를 자동으로 보냅니다.
- Route Handler는 `auth.getClaims()`로 사용자를 검증합니다.
- `storeId`와 `testId`는 URL에 함께 넣고, 서버가 매장 소유 관계를 다시 검사합니다.
- `private` 테이블과 원본 투표·원장은 브라우저에서 직접 조회할 수 없습니다.
- Server Component는 자기 서비스의 `/api`를 HTTP로 재호출하지 말고 `apps/web/lib/server/domain-api.ts`의 서비스 경계를 사용합니다.

## 3. 공통 TypeScript 계약

프로젝트 내부 타입의 기준은 `apps/web/lib/supabase/database.types.ts`입니다. UI 계층에서는 다음처럼 HTTP 응답 타입을 별도로 두는 편이 안전합니다.

```ts
export type UUID = string
export type ISODateTime = string

export type TestStatus =
  "draft" | "scheduled" | "active" | "completed" | "cancelled"

export type AgeBand =
  "teens" | "twenties" | "thirties" | "forties" | "fifties" | "sixties_plus"

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "OWN_STORE_TEST"
  | "CONSENT_REQUIRED"
  | "NOT_FOUND"
  | "ASSET_NOT_AVAILABLE"
  | "ALREADY_VOTED"
  | "IDEMPOTENCY_CONFLICT"
  | "INVALID_TEST_STATE"
  | "RESULT_NOT_AVAILABLE"
  | "TEST_NOT_ACTIVE"
  | "INSUFFICIENT_CREDIT"
  | "INVALID_OPTION"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR"

export type ApiErrorBody = { error: { code: ApiErrorCode } }
```

HTTP 오류는 Supabase 원문 대신 항상 다음 형태입니다.

```json
{ "error": { "code": "VALIDATION_FAILED" } }
```

공통 fetch wrapper 예시:

```ts
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number
  ) {
    super(code)
  }
}

export async function apiFetch<T>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  })

  const body = (await response.json()) as T | ApiErrorBody
  if (!response.ok) {
    const code = "error" in body ? body.error.code : ("INTERNAL_ERROR" as const)
    throw new ApiError(code, response.status)
  }
  return body as T
}
```

상태 코드 처리:

| HTTP | 코드                                                            | UI 처리                                                       |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| 401  | `UNAUTHENTICATED`                                               | 현재 경로를 검증된 `next`로 저장하고 `/login` 이동            |
| 403  | `CONSENT_REQUIRED`                                              | 온보딩 약관 단계 이동                                         |
| 403  | `OWN_STORE_TEST`                                                | 본인 매장 테스트 투표 불가 안내                               |
| 403  | `FORBIDDEN`                                                     | 권한 부족 안내                                                |
| 404  | `NOT_FOUND`, `ASSET_NOT_AVAILABLE`                              | 존재 여부를 구분하지 않는 404 화면                            |
| 409  | `ALREADY_VOTED`                                                 | 완료/결과 화면으로 유도                                       |
| 409  | `INVALID_TEST_STATE`, `TEST_NOT_ACTIVE`, `RESULT_NOT_AVAILABLE` | 서버 상태 재조회 후 CTA 갱신                                  |
| 409  | `IDEMPOTENCY_CONFLICT`                                          | 새 요청 키로 자동 재시도하지 말고 사용자에게 요청 재생성 안내 |
| 422  | `INSUFFICIENT_CREDIT`                                           | 운영자 지갑 화면과 충전 미지원 안내                           |
| 422  | `INVALID_OPTION`, `VALIDATION_FAILED`                           | 입력값 또는 최신 테스트 옵션을 다시 확인                      |
| 500  | `INTERNAL_ERROR`                                                | 일반 오류 문구와 수동 재시도 제공                             |

## 4. 인증과 온보딩 순서

모든 도메인 API는 로그인 세션을 요구합니다. Google 로그인 성공 뒤 권장 순서는 다음과 같습니다.

1. `GET /api/me/profile`
2. `requiredConsentsAccepted === false`이면 `GET /api/me/consents`
3. 사용자가 필수 약관을 선택하면 `POST /api/me/consents`
4. `PATCH /api/me/profile`로 기본 정보와 관심 업종 저장
5. 반환된 `onboardingCompletedAt`을 확인하고 역할별 첫 화면으로 이동

`/login?next=...`을 구현할 때 `next`는 `/owner`, `/vote`, `/me`, `/onboarding`으로 시작하는 내부 경로만 허용해야 합니다. 외부 URL이나 `//example.com` 형태는 거부합니다.

### 프로필

`GET /api/me/profile`

```ts
type MyProfile = {
  id: UUID
  displayName: string
  avatarUrl: string | null
  onboardingCompletedAt: ISODateTime | null
  regionCode: string | null
  ageBand: AgeBand | null
  requiredConsentsAccepted: boolean
  interestCategoryIds: number[]
}
```

`PATCH /api/me/profile`

```json
{
  "displayName": "포스트픽 사용자",
  "regionCode": "SEOUL-SEONGDONG",
  "ageBand": "twenties",
  "interestCategoryIds": [1, 3]
}
```

- `displayName`: 1~80자, 필수
- `regionCode`: `null` 또는 최대 20자
- `ageBand`: enum 또는 `null`
- `interestCategoryIds`: 활성 category ID의 정수 배열, 미선택 시 `[]`
- 응답: 갱신된 `MyProfile`

필수 약관을 먼저 동의한 뒤 프로필을 저장하면 `onboardingCompletedAt`이 최초 한 번 기록됩니다.

### 약관

`GET /api/me/consents`

```ts
type LegalDocument = {
  id: UUID
  key: string
  version: string
  title: string
  required: boolean
}
```

응답은 `LegalDocument[]`입니다.

`POST /api/me/consents`

```json
{ "documentIds": ["uuid-1", "uuid-2"] }
```

응답:

```json
{ "requiredAccepted": true }
```

필수 문서를 모두 포함했는지 프론트에서도 검사하되, 최종 판정은 응답값을 사용합니다. 선택 약관 철회 API는 현재 범위에 없습니다.

### 카탈로그

`GET /api/catalog`

```ts
type Catalog = {
  categories: Array<{ id: number; slug: string; name: string }>
  pricingPackages: Array<{
    targetVotes: 30 | 50 | 70 | 100
    priceCredits: number
    rewardPoints: number
  }>
}
```

온보딩 관심 업종, 매장 업종, 테스트 가격 카드에 같은 응답을 사용합니다.

## 5. 운영자 API

### 매장 목록과 생성

`GET /api/owner/stores`

```ts
type StoreSummary = {
  id: UUID
  name: string
  categoryId: number
  categoryName: string
  regionCode: string
  address: string
  createdAt: ISODateTime
}
```

응답은 `StoreSummary[]`입니다. 매장이 여러 개면 선택한 `storeId`를 URL에 유지합니다.

`POST /api/owner/stores` → `201`

```json
{
  "name": "민지의 열기 카페",
  "categoryId": 1,
  "regionCode": "SEOUL-SEONGDONG",
  "address": "서울 성동구 성수동"
}
```

응답은 `categoryName`, `createdAt`을 제외한 매장 기본 정보입니다. 필수 약관 미동의 시 `CONSENT_REQUIRED`입니다.

### 매장 대시보드와 테스트 목록

`GET /api/owner/stores/{storeId}/tests`

```ts
type OwnerDashboard = {
  storeId: UUID
  tests: Array<{
    id: UUID
    slug: string
    title: string
    status: TestStatus
    voteCount: number
    targetVotes: number
    startsAt: ISODateTime
    endsAt: ISODateTime
  }>
}
```

이 endpoint는 테스트 목록이자 매장 대시보드의 기준 응답입니다. 다른 사용자의 `storeId`는 항상 404입니다.

### 테스트 draft 생성과 수정

`POST /api/owner/stores/{storeId}/tests` → `201`

```json
{
  "title": "신메뉴 포스터 테스트",
  "question": "어떤 포스터가 더 방문하고 싶게 느껴지나요?",
  "startsAt": "2026-08-20T00:00:00.000Z",
  "endsAt": "2026-08-23T00:00:00.000Z",
  "targetVotes": 100,
  "rewardPoints": 30
}
```

`PATCH /api/owner/stores/{storeId}/tests/{testId}`는 같은 body를 사용합니다.

검증 규칙:

- 제목 1~~120자, 질문 1~~300자
- `targetVotes`: `30 | 50 | 70 | 100`
- `rewardPoints`: 선택한 카탈로그 패키지의 `rewardPoints`와 일치해야 함
- 운영기간: 종료가 시작보다 늦어야 하며 최대 30일
- 날짜는 ISO 8601 문자열로 전송
- 수정은 `draft` 상태에서만 가능

생성 응답:

```ts
type CreatedDraft = {
  id: UUID
  storeId: UUID
  slug: string
  status: "draft"
  optionAId: UUID
  optionBId: UUID
}
```

수정 응답은 `{ id: UUID; status: "draft" }`입니다.

### 포스터 업로드

각 A/B 옵션마다 아래 3단계를 수행합니다.

1. 서버에서 Storage 경로 발급
2. 브라우저에서 비공개 bucket으로 직접 업로드
3. 업로드 완료 경로를 서버에 확정

경로 발급:

`POST /api/owner/stores/{storeId}/tests/{testId}/options/{optionId}`

```json
{ "extension": "webp" }
```

허용 확장자는 `jpg`, `jpeg`, `png`, `webp`입니다. 응답은 `{ "assetPath": "..." }`입니다.

직접 업로드:

```ts
import { createClient } from "@/lib/supabase/client"

export async function uploadPoster(assetPath: string, file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error("FILE_TOO_LARGE")
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("UNSUPPORTED_FILE_TYPE")
  }

  const supabase = createClient()
  const { error } = await supabase.storage
    .from("test-posters")
    .upload(assetPath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw error
}
```

경로 확정:

`PATCH /api/owner/stores/{storeId}/tests/{testId}/options/{optionId}`

```json
{ "assetPath": "경로-발급-응답값" }
```

확정 응답은 `{ testId, optionId, assetPath }`입니다. A/B 두 옵션을 모두 확정하기 전에는 시작할 수 없습니다. 파일은 JPEG/PNG/WebP, 최대 5MB이며 bucket은 public URL을 제공하지 않습니다.

조회 API의 `assetUrl`은 10분짜리 signed URL입니다. DB나 클라이언트 영구 상태에 저장하지 말고 응답을 다시 조회해 갱신합니다.

### 테스트 시작과 예약 취소

브라우저에서 사용자가 시작 확인 버튼을 누르는 순간 UUID를 한 번 만들고, 요청이 성공하거나 확정 실패할 때까지 같은 키를 재사용합니다.

```ts
const idempotencyKey = crypto.randomUUID()
```

`POST /api/owner/stores/{storeId}/tests/{testId}/start`

```json
{ "idempotencyKey": "client-generated-uuid" }
```

응답:

```ts
type StartTestResult = {
  testId: UUID
  status: "scheduled" | "active"
  chargedCredits: number
  ownerCreditBalance: number
}
```

`POST /api/owner/stores/{storeId}/tests/{testId}/cancel`도 같은 body를 사용합니다. 시작 전 `scheduled` 테스트만 취소할 수 있고 응답은 `{ testId, status: "cancelled", ownerCreditBalance }`입니다.

버튼 중복 클릭, 네트워크 타임아웃, 브라우저 재전송에는 같은 키를 사용합니다. 사용자가 내용을 바꿔 새 작업을 시작할 때만 새 키를 생성합니다.

### 진행 현황과 결과

`GET /api/owner/stores/{storeId}/tests/{testId}/progress`

```ts
type TestProgress = {
  id: UUID
  storeId: UUID
  title: string
  question: string
  status: TestStatus
  voteCount: number
  targetVotes: number
  rewardPoints: number
  detailViews: number
  startsAt: ISODateTime
  endsAt: ISODateTime
  completedAt: ISODateTime | null
  options: Array<{
    id: UUID
    position: 1 | 2
    voteCount: number
    assetUrl?: string
    assetPath?: null
  }>
}
```

`scheduled` 또는 `active` 화면은 15초마다 조회하고, `visibilitychange`로 다시 보이거나 창이 focus될 때 즉시 재조회합니다. `completed` 또는 `cancelled`가 되면 폴링을 중지합니다.

`GET /api/owner/stores/{storeId}/tests/{testId}/results`

```ts
type TestResult = {
  testId: UUID
  title: string
  status: TestStatus
  voteCount: number
  targetVotes: number
  options: Array<{
    id: UUID
    position: 1 | 2
    voteCount: number
    percentage: number
    assetUrl?: string
    assetPath?: null
  }>
}
```

운영자 결과 API는 draft/진행 중 상태도 반환할 수 있습니다. 완료 여부에 따른 화면 정책은 `status`로 결정합니다.

### 운영자 지갑

`GET /api/owner/wallet`

```ts
type OwnerWallet = {
  balance: number
  entries: Array<{
    id: UUID
    testId: UUID | null
    type: "admin_grant" | "test_charge" | "test_refund" | "adjustment"
    amount: number
    balanceAfter: number
    createdAt: ISODateTime
  }>
}
```

최신 50개 원장만 반환합니다. 충전·결제 UI와 API는 현재 구현 범위가 아닙니다.

## 6. 투표 고객 API

### 참여 가능한 테스트 탐색

`GET /api/votes/available`

현재 고객이 참여할 수 있는 활성 테스트를 최대 20개 반환합니다. 본인 매장 테스트와 이미 투표한 테스트는 제외하고, 고객이 활동 지역을 설정했다면 같은 지역만 보여줍니다. 관심 업종과 마감 시각을 기준으로 정렬합니다.

```ts
type AvailableTest = {
  id: UUID
  slug: string
  storeName: string
  categoryName: string
  regionCode: string
  title: string
  question: string
  rewardPoints: number
  voteCount: number
  targetVotes: number
  endsAt: ISODateTime
  options: Array<{
    id: UUID
    position: 1 | 2
    assetUrl: string
  }>
}
```

포스터 URL은 다른 조회 API와 마찬가지로 10분짜리 signed URL이며 고객 홈에 영구 저장하지 않습니다.

### 투표 화면 조회

`GET /api/vote/{slug}`

```ts
type VoteContext = {
  id: UUID
  slug: string
  storeId: UUID
  storeName: string
  title: string
  question: string
  status: TestStatus
  startsAt: ISODateTime
  endsAt: ISODateTime
  rewardPoints: number
  ownedByCurrentUser: boolean
  alreadyVoted: boolean
  options: Array<{
    id: UUID
    position: 1 | 2
    assetUrl?: string
    assetPath?: null
  }>
}
```

렌더링 분기:

- `ownedByCurrentUser`: 투표 CTA 비활성화
- `alreadyVoted`: 재투표 대신 완료/결과 화면 이동
- `scheduled`: 시작 전 안내
- `active`: A/B 선택 가능
- `completed`: 결과 endpoint 조회
- 404: 존재하지 않거나 공개할 수 없는 테스트

상세 화면이 실제로 노출된 뒤 `POST /api/vote/{slug}/detail-view`를 한 번 호출합니다. 같은 사용자·테스트·한국 날짜에는 여러 번 호출해도 한 번만 집계됩니다.

```ts
type DetailViewResult = {
  recorded: boolean
  viewedOn: string // YYYY-MM-DD
}
```

### 투표 제출

`POST /api/vote/{slug}` → `201`

```json
{
  "optionId": "선택한-option-uuid",
  "idempotencyKey": "client-generated-uuid"
}
```

응답:

```ts
type VoteResult = {
  voteId: UUID
  testId: UUID
  rewardPoints: number
  rewardPointBalance: number
  testCompleted: boolean
  ok?: true
}
```

같은 키 재전송은 같은 투표 결과를 반환합니다. 다른 키로 같은 테스트를 다시 투표하면 `ALREADY_VOTED`입니다. 운영자는 자기 매장 테스트에 투표할 수 없습니다.

### 고객 결과와 보상 지갑

`GET /api/vote/{slug}/result`

완료된 테스트만 반환하며, 그 전에는 `RESULT_NOT_AVAILABLE`입니다.

```ts
type PublicResult = {
  testId: UUID
  title: string
  voteCount: number
  options: Array<{
    id: UUID
    position: 1 | 2
    voteCount: number
    percentage: number
    assetUrl?: string
  }>
}
```

`GET /api/me/rewards`

```ts
type RewardWallet = {
  balance: number
  entries: Array<{
    id: UUID
    voteId: UUID | null
    type: "vote_reward" | "adjustment"
    amount: number
    balanceAfter: number
    createdAt: ISODateTime
  }>
}
```

고객 포인트와 운영자 크레딧은 서로 다른 자산이며 합산하거나 전환하지 않습니다.

## 7. 화면별 호출표

| 화면                                             | 최초 조회                      | 사용자 액션                                        |
| ------------------------------------------------ | ------------------------------ | -------------------------------------------------- |
| `/onboarding`                                    | profile, consents, catalog     | consents POST → profile PATCH                      |
| `/owner/stores`                                  | stores GET                     | store POST                                         |
| `/owner/stores/[storeId]/dashboard`              | store tests GET                | 테스트 상세 이동                                   |
| `/owner/stores/[storeId]/tests/new`              | catalog GET                    | draft POST → A/B upload → asset PATCH → start POST |
| `/owner/stores/[storeId]/tests/[testId]`         | progress GET                   | 15초 폴링, scheduled cancel                        |
| `/owner/stores/[storeId]/tests/[testId]/results` | results GET                    | signed URL 만료 시 재조회                          |
| `/owner/wallet`                                  | owner wallet GET               | 현재 조회 전용                                     |
| `/vote/[slug]`                                   | vote context GET               | detail-view POST → vote POST                       |
| `/vote/[slug]/complete`                          | public result GET, rewards GET | 결과가 아직 없으면 상태 안내                       |
| `/me`                                            | profile GET, rewards GET       | profile PATCH                                      |

## 8. 폴링, 동시 요청과 클라이언트 상태

- 진행 현황은 15초 폴링합니다. Realtime 채널을 열지 않습니다.
- GET 응답은 `private, no-store`이므로 CDN/브라우저 캐시에 의존하지 않습니다.
- 시작·취소·투표 mutation은 진행 중 버튼을 disable하되, 네트워크 재시도에는 같은 idempotency key를 사용합니다.
- `AbortController`로 이전 화면의 폴링 요청을 취소합니다.
- 서버 상태가 UI 로컬 상태보다 우선합니다. mutation 성공 뒤 관련 GET을 다시 조회합니다.
- signed URL을 전역 캐시, DB, URL query에 저장하지 않습니다.

## 9. 로컬 개발과 검증 시나리오

```bash
pnpm install --frozen-lockfile
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

로컬 Auth는 OAuth 비밀 없이 DB 테스트를 재현하기 위해 Google provider가 비활성화되어 있습니다. 실제 Google 로그인은 연결된 원격 Supabase 또는 팀이 별도로 준비한 개발 프로젝트에서 검증합니다.

PR 전 실행:

```bash
pnpm db:check
pnpm check
pnpm format:check
```

프론트엔드 수동 QA:

1. 비로그인 API가 401과 `UNAUTHENTICATED`를 반환하는지 확인합니다.
2. 필수 약관 전 매장 생성·투표가 `CONSENT_REQUIRED`인지 확인합니다.
3. 여러 매장 URL에서 다른 `storeId`/`testId` 조합이 404인지 확인합니다.
4. A/B 파일 형식과 5MB 제한을 클라이언트와 서버 양쪽에서 확인합니다.
5. 동일 시작 키를 재전송해 크레딧이 한 번만 차감되는지 확인합니다.
6. 동일 투표 키를 재전송해 투표·보상이 한 번만 기록되는지 확인합니다.
7. 서로 다른 키의 동시 중복 투표에서 하나만 성공하는지 확인합니다.
8. 15초 폴링, focus 복귀, 완료 시 폴링 중지를 확인합니다.
9. signed URL 만료 뒤 재조회로 이미지가 다시 표시되는지 확인합니다.
10. 320px, 768px, 1440px와 키보드만으로 전체 흐름을 확인합니다.

## 10. 알려진 제한과 후속 범위

- 운영자 크레딧 구매 API는 아직 없으며 신규 운영자는 잔액 0으로 시작합니다.
- 데모 환경에서는 `pnpm demo:grant-credit -- --email <운영자 이메일> --amount 10000`으로 로컬 크레딧을 지급합니다. 연결된 프로젝트는 명시적으로 `--linked`를 추가합니다.
- 실제 결제, 포인트 사용·환전, 사업자 인증, 알림, 계정 삭제는 후속 범위입니다.
- 포스터 교체 시 이전 객체 자동 정리는 아직 구현되지 않았습니다.
- Edge Function은 배포하지 않습니다. 현재 기능은 Next.js BFF와 DB RPC로 완결됩니다.
- 외부 결제 webhook, SMS/메일/푸시, 보고서 파일 생성이 확정될 때만 Edge Function을 추가합니다.
