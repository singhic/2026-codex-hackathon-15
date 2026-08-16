"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, PencilIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type StoreSummary,
  type TestProgress,
} from "@/lib/api/client"

import {
  MetricCard,
  OwnerShell,
  PosterPlaceholder,
} from "../../_components/owner-ui"

export function OwnerTestClient({ testId }: { testId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedStoreId = searchParams.get("storeId")
  const [stores, setStores] = useState<StoreSummary[]>([])
  const [progress, setProgress] = useState<TestProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedStore = useMemo(
    () =>
      stores.find((store) => store.id === requestedStoreId) ??
      stores[0] ??
      null,
    [requestedStoreId, stores]
  )

  const loadProgress = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedStore) return

      try {
        const nextProgress = await apiFetch<TestProgress>(
          `/api/owner/stores/${selectedStore.id}/tests/${testId}/progress`,
          { signal }
        )
        setProgress(nextProgress)
        setErrorMessage(null)
      } catch (error) {
        if (signal?.aborted) return
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`)
          return
        }
        setErrorMessage(
          error instanceof ApiError
            ? getApiErrorMessage(error.code)
            : "테스트 진행 현황을 불러오지 못했습니다."
        )
      }
    },
    [pathname, router, selectedStore, testId]
  )

  useEffect(() => {
    let cancelled = false

    async function loadStores() {
      setIsLoading(true)
      try {
        const nextStores = await apiFetch<StoreSummary[]>("/api/owner/stores")
        if (cancelled) return
        setStores(nextStores)
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        } else {
          setErrorMessage("매장 정보를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadStores()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  useEffect(() => {
    if (!selectedStore) return
    const controller = new AbortController()
    void loadProgress(controller.signal)

    if (progress?.status === "completed" || progress?.status === "cancelled") {
      return () => controller.abort()
    }

    const timer = window.setInterval(() => {
      void loadProgress(controller.signal)
    }, 15_000)
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadProgress(controller.signal)
      }
    }
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener("focus", refresh)

    return () => {
      controller.abort()
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [loadProgress, progress?.status, selectedStore])

  async function cancelTest() {
    if (!selectedStore || !progress || progress.status !== "scheduled") return
    setIsCancelling(true)
    setErrorMessage(null)
    try {
      await apiFetch(
        `/api/owner/stores/${selectedStore.id}/tests/${testId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
        }
      )
      await loadProgress()
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "테스트를 취소하지 못했습니다."
      )
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading || !progress) {
    return (
      <OwnerShell showTabs={false} headerTitle="테스트 진행 현황">
        <Message>{errorMessage ?? "진행 현황을 불러오는 중..."}</Message>
      </OwnerShell>
    )
  }

  const progressPercent = Math.round(
    (progress.voteCount / Math.max(progress.targetVotes, 1)) * 100
  )
  const sortedOptions = [...progress.options].sort(
    (a, b) => a.position - b.position
  )

  return (
    <OwnerShell
      showTabs={false}
      storeId={selectedStore?.id}
      backHref={`/owner/tests?storeId=${selectedStore?.id ?? ""}`}
      headerTitle="테스트 진행 현황"
      headerAction={
        progress.status === "draft" ? (
          <Link
            href={`/owner/tests/${testId}/edit?storeId=${selectedStore?.id ?? ""}`}
            className="text-base font-semibold text-[#0a85ff]"
          >
            수정
          </Link>
        ) : null
      }
    >
      <section className="flex flex-1 flex-col px-5 pt-3 sm:px-8 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-10">
        {errorMessage ? (
          <p
            className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-full border border-[#3b3b40] px-4 py-1.5 text-[13px]">
            {getStatusLabel(progress.status)}
          </span>
          <span className="text-xl font-semibold text-[#adadb8]">
            {formatRemaining(progress.endsAt)}
          </span>
        </div>

        <div className="relative mt-7 h-10 overflow-hidden rounded-xl bg-[#1c1c1e]">
          <div
            className="absolute inset-y-0 left-0 rounded-xl bg-[#0091ff]"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold">
            {Math.min(progressPercent, 100)}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MetricCard label="투표 수" value={`${progress.voteCount}명`} />
          <MetricCard label="목표 투표" value={`${progress.targetVotes}명`} />
          <MetricCard
            label="상세 보기 수"
            value={`${progress.detailViews}회`}
          />
        </div>

        <div className="mt-12 md:max-w-none">
          <p className="text-[15px] font-semibold">테스트 포스터</p>
          <div className="mt-3 grid grid-cols-2 gap-5">
            {sortedOptions.map((option) => (
              <PosterPlaceholder
                key={option.id}
                label={`포스터 ${option.position === 1 ? "A" : "B"}`}
                variant={option.position === 1 ? "a" : "b"}
                imageSrc={option.assetUrl}
                className="md:h-[280px]"
              />
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-8 pb-5">
          <Link
            href={`/owner/tests/${testId}/results?storeId=${selectedStore?.id ?? ""}`}
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#0a85ff] text-[15px] font-semibold transition-colors hover:bg-[#0a85ff]/90"
          >
            결과 확인
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
          {progress.status === "scheduled" ? (
            <button
              type="button"
              disabled={isCancelling}
              className="flex h-10 w-full items-center justify-center text-sm font-semibold text-[#adadb8] hover:text-white disabled:opacity-50"
              onClick={() => void cancelTest()}
            >
              {isCancelling ? "취소 중..." : "예약 취소"}
            </button>
          ) : null}
          {progress.status === "draft" ? (
            <Link
              href={`/owner/tests/${testId}/edit?storeId=${selectedStore?.id ?? ""}`}
              className="flex h-10 items-center justify-center gap-2 text-sm font-semibold text-[#adadb8] hover:text-white"
            >
              <PencilIcon className="size-4" aria-hidden="true" />
              테스트 수정
            </Link>
          ) : null}
        </div>
      </section>
    </OwnerShell>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-[700px] items-center justify-center px-6 text-center text-sm text-[#adadb8]">
      {children}
    </section>
  )
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "진행 중"
    case "scheduled":
      return "예약됨"
    case "completed":
      return "완료"
    case "cancelled":
      return "취소됨"
    default:
      return "초안"
  }
}

function formatRemaining(endsAt: string) {
  const remainingDays = Math.ceil(
    (new Date(endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  )
  return remainingDays > 0 ? `D-${remainingDays}` : "마감"
}
