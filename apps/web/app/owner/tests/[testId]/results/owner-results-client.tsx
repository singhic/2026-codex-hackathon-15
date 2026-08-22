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
  const conversionRate =
    result.detailViews > 0
      ? Math.min(100, Math.round((result.voteCount / result.detailViews) * 100))
      : 0
  const targetRate =
    result.targetVotes > 0
      ? Math.min(100, Math.round((result.voteCount / result.targetVotes) * 100))
      : 0

  return (
    <OwnerShell activeTab="picks" storeId={selectedStore?.id}>
      <section className="flex flex-1 flex-col px-5 pt-7 pb-5 sm:px-8 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold">완료 리포트</h1>
            <p className="mt-1 text-sm text-[#adadb8]">{result.title}</p>
          </div>
          <Link
            href={`/owner/tests/${testId}?storeId=${selectedStore?.id ?? ""}`}
            className="rounded-md text-sm font-semibold text-[#adadb8] transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[#0a85ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            진행 현황
          </Link>
        </div>

        <h2 className="mt-8 text-base font-semibold">성과 요약</h2>
        <div className="mt-3 grid max-w-none grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="상세 조회" value={`${result.detailViews}회`} />
          <MetricCard label="투표 수" value={`${result.voteCount}명`} />
          <MetricCard label="투표 전환율" value={`${conversionRate}%`} />
          <MetricCard label="목표 달성률" value={`${targetRate}%`} />
        </div>
        <p className="mt-3 text-xs leading-5 text-[#adadb8]">
          투표 전환율은 중복 제거된 상세 조회 대비 실제 투표 비율입니다. 현재
          상태는 {getStatusLabel(result.status)}이며 목표는 {result.targetVotes}
          명입니다.
        </p>

        <h2 className="mt-8 text-[24px] font-semibold">고객이 픽한 포스터</h2>
        <article className="mt-3 grid max-w-[820px] gap-4 rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4 sm:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)] sm:p-6">
          {winner ? (
            <section aria-labelledby="winner-heading" className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#70b9ff]">
                    CUSTOMER PICK
                  </p>
                  <h3
                    id="winner-heading"
                    className="mt-1 text-xl font-semibold"
                  >
                    {winnerLabel}
                  </h3>
                </div>
                <span className="rounded-full bg-[#0a85ff] px-3 py-1.5 text-sm font-semibold">
                  {winner.percentage}% · {winner.voteCount}표
                </span>
              </div>
              <div className="relative mt-4 aspect-[4/3] min-h-[220px] overflow-hidden rounded-[14px] bg-[#29292e] sm:aspect-[16/10]">
                <PosterPlaceholder
                  label={winnerLabel}
                  variant={winner.position === 1 ? "a" : "b"}
                  imageSrc={winner.assetUrl}
                  className="h-full w-full rounded-[14px] border-0"
                />
              </div>
            </section>
          ) : null}

          {loser ? (
            <section className="flex min-w-0 flex-col justify-end rounded-[14px] bg-[#26262b] p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 sm:block">
                <h3 className="text-sm font-semibold text-[#d4d4dc]">
                  포스터 {loser.position === 1 ? "A" : "B"}
                </h3>
                <p className="text-sm font-semibold sm:mt-1">
                  {loser.percentage}% · {loser.voteCount}표
                </p>
              </div>
              <PosterPlaceholder
                label={`포스터 ${loser.position === 1 ? "A" : "B"}`}
                variant={loser.position === 1 ? "a" : "b"}
                imageSrc={loser.assetUrl}
                className="mt-3 h-[180px] w-full rounded-[10px] border-0 sm:h-[220px]"
              />
            </section>
          ) : null}

          {!winner && !loser ? (
            <p className="text-sm text-[#adadb8]">
              집계할 포스터 결과가 없습니다.
            </p>
          ) : null}
        </article>
      </section>
    </OwnerShell>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex min-h-[700px] items-center justify-center px-6 text-center text-sm text-[#adadb8]"
    >
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
