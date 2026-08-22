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

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number
  ) {
    super(code)
    this.name = "ApiError"
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

  const text = await response.text()
  let body: unknown = null

  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const code = isApiErrorBody(body) ? body.error.code : "INTERNAL_ERROR"
    throw new ApiError(code, response.status)
  }

  return body as T
}

export type MyProfile = {
  id: UUID
  displayName: string
  avatarUrl: string | null
  onboardingCompletedAt: ISODateTime | null
  regionCode: string | null
  ageBand: AgeBand | null
  requiredConsentsAccepted: boolean
  interestCategoryIds: number[]
}

export type LegalDocument = {
  id: UUID
  key: string
  version: string
  title: string
  required: boolean
}

export type Catalog = {
  categories: Array<{ id: number; slug: string; name: string }>
  pricingPackages: Array<{
    targetVotes: 30 | 50 | 70 | 100
    priceCredits: number
    rewardPoints: number
  }>
}

export type StoreSummary = {
  id: UUID
  name: string
  categoryId: number
  categoryName: string
  regionCode: string
  address: string
  createdAt: ISODateTime
}

export type OwnerDashboard = {
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

export type CreatedDraft = {
  id: UUID
  storeId: UUID
  slug: string
  status: "draft"
  optionAId: UUID
  optionBId: UUID
}

export type TestProgress = {
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

export type TestResult = {
  testId: UUID
  title: string
  status: TestStatus
  voteCount: number
  targetVotes: number
  detailViews: number
  options: Array<{
    id: UUID
    position: 1 | 2
    voteCount: number
    percentage: number
    assetUrl?: string
    assetPath?: null
  }>
}

export type OwnerWallet = {
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

export type VoteContext = {
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

export type AvailableTest = {
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

export type StartTestResult = {
  testId: UUID
  status: "scheduled" | "active"
  chargedCredits: number
  ownerCreditBalance: number
}

export type VoteResult = {
  voteId: UUID
  testId: UUID
  rewardPoints: number
  rewardPointBalance: number
  testCompleted: boolean
  ok?: true
}

export type PublicResult = {
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

export type RewardWallet = {
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

export function getLoginHref(pathname?: string) {
  const next = pathname && pathname.startsWith("/") ? pathname : "/"
  return `/login?next=${encodeURIComponent(next)}`
}

export function getApiErrorMessage(code: ApiErrorCode) {
  switch (code) {
    case "UNAUTHENTICATED":
      return "로그인이 필요합니다."
    case "CONSENT_REQUIRED":
      return "필수 약관에 동의해 주세요."
    case "OWN_STORE_TEST":
      return "내 매장 테스트에는 투표할 수 없습니다."
    case "ALREADY_VOTED":
      return "이미 참여한 투표입니다."
    case "INSUFFICIENT_CREDIT":
      return "사용 가능한 크레딧이 부족합니다."
    case "INVALID_OPTION":
      return "최신 테스트 정보를 다시 불러와 주세요."
    case "NOT_FOUND":
    case "ASSET_NOT_AVAILABLE":
      return "요청한 정보를 찾을 수 없습니다."
    case "INVALID_TEST_STATE":
    case "TEST_NOT_ACTIVE":
    case "RESULT_NOT_AVAILABLE":
      return "현재 상태에서는 이 작업을 진행할 수 없습니다."
    case "IDEMPOTENCY_CONFLICT":
      return "요청이 충돌했습니다. 새 요청으로 다시 시도해 주세요."
    case "FORBIDDEN":
      return "이 작업을 수행할 권한이 없습니다."
    case "VALIDATION_FAILED":
      return "입력값을 확인해 주세요."
    default:
      return "문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false
  }

  const error = value.error
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  )
}
