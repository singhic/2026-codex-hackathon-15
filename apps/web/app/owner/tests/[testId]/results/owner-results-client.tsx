"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type StoreSummary,
  type TestResult,
} from "@/lib/api/client"

import {
  MetricCard,
  OwnerShell,
  PosterPlaceholder,
} from "../../../_components/owner-ui"

export function OwnerResultsClient({ testId }: { testId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedStoreId = searchParams.get("storeId")
  const [stores, setStores] = useState<StoreSummary[]>([])
  const [result, setResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedStore = useMemo(
    () =>
      stores.find((store) => store.id === requestedStoreId) ??
      stores[0] ??
      null,
    [requestedStoreId, stores]
  )

  const loadResult = useCallback(async () => {
    if (!selectedStore) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      setResult(
        await apiFetch<TestResult>(
          `/api/owner/stores/${selectedStore.id}/tests/${testId}/results`
        )
      )
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setErrorMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "결과를 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router, selectedStore, testId])

  useEffect(() => {
    let cancelled = false
    apiFetch<StoreSummary[]>("/api/owner/stores")
      .then((nextStores) => {
        if (!cancelled) setStores(nextStores)
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        } else {
          setErrorMessage("매장 정보를 불러오지 못했습니다.")
          setIsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  useEffect(() => {
    void loadResult()
  }, [loadResult])

  if (isLoading || !result) {
    return (
      <OwnerShell activeTab="picks">
        <Message>{errorMessage ?? "결과 리포트를 불러오는 중..."}</Message>
      </OwnerShell>
    )
  }

  const sortedOptions = [...result.options].sort(
    (a, b) => b.percentage - a.percentage
  )
  const winner = sortedOptions[0]
  const loser = sortedOptions[1]
  const winnerLabel = winner
    ? `포스터 ${winner.position === 1 ? "A" : "B"}`
    : "고객 픽"

  return (
    <OwnerShell activeTab="picks" storeId={selectedStore?.id}>
      <section className="flex flex-1 flex-col px-5 pt-7 pb-5 sm:px-8 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold">완료 리포트</h1>
            <p className="mt-1 text-sm text-[#adadb8]">
              고객이 선택한 포스터 결과를 확인하세요.
            </p>
          </div>
          <Link
            href={`/owner/tests/${testId}?storeId=${selectedStore?.id ?? ""}`}
            className="text-sm font-semibold text-[#adadb8]"
          >
            진행 현황
          </Link>
        </div>

        <h2 className="mt-8 text-base font-semibold">성과 요약</h2>
        <div className="mt-3 grid max-w-none grid-cols-3 gap-3">
          <MetricCard label="투표 수" value={`${result.voteCount}명`} />
          <MetricCard label="목표 투표" value={`${result.targetVotes}명`} />
          <MetricCard label="상태" value={getStatusLabel(result.status)} />
        </div>

        <h2 className="mt-8 text-[24px] font-semibold">고객이 픽한 포스터</h2>
        <article className="relative mt-3 min-h-[322px] max-w-[640px] rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4">
          {winner ? (
            <div className="absolute top-[58px] left-6 w-[196px]">
              <span className="mx-auto flex h-9 w-fit min-w-[84px] items-center justify-center rounded-full bg-[#0a85ff] px-4 text-base font-semibold">
                {winnerLabel.replace("포스터 ", "")}안
              </span>
              <div className="relative mt-3 flex h-[200px] w-[196px] items-center justify-center rounded-[12px] bg-[#29292e]">
                <PosterPlaceholder
                  label={winnerLabel}
                  variant={winner.position === 1 ? "a" : "b"}
                  imageSrc={winner.assetUrl}
                  className="h-[196px] w-[165px] border-0 rounded-[10px]"
                />
                <p className="absolute inset-x-0 bottom-4 text-center text-[36px] font-semibold leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  {winner.percentage}%
                </p>
              </div>
            </div>
          ) : null}

          {loser ? (
            <div className="absolute top-[190px] right-5 w-[84px] text-center">
              <p className="text-xs text-[#adadb8]">
                포스터 {loser.position === 1 ? "A" : "B"}
              </p>
              <PosterPlaceholder
                label={`포스터 ${loser.position === 1 ? "A" : "B"}`}
                variant={loser.position === 1 ? "a" : "b"}
                imageSrc={loser.assetUrl}
                compact
                className="mt-2 h-[78px] w-[84px] border-0 rounded-[10px]"
              />
              <p className="mt-1 text-xs text-white">{loser.percentage}%</p>
            </div>
          ) : null}
        </article>

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
    case "completed":
      return "완료"
    case "active":
      return "진행 중"
    case "scheduled":
      return "예약됨"
    case "cancelled":
      return "취소됨"
    default:
      return "초안"
  }
}
