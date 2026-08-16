"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, MapPinIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type OwnerDashboard,
  type StoreSummary,
} from "@/lib/api/client"
import { getRegionLabel } from "@/lib/regions"

import {
  MetricCard,
  OwnerShell,
  PosterPlaceholder,
  ProgressBar,
  SecondaryLink,
} from "../_components/owner-ui"

export function OwnerDashboardClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedStoreId = searchParams.get("storeId")
  const [stores, setStores] = useState<StoreSummary[]>([])
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedStore = useMemo(
    () =>
      stores.find((store) => store.id === requestedStoreId) ??
      stores[0] ??
      null,
    [requestedStoreId, stores]
  )

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const nextStores = await apiFetch<StoreSummary[]>("/api/owner/stores")
      setStores(nextStores)

      const nextStore =
        nextStores.find((store) => store.id === requestedStoreId) ??
        nextStores[0]

      if (!nextStore) {
        setDashboard(null)
        return
      }

      if (nextStore.id !== requestedStoreId) {
        router.replace(
          `${pathname}?storeId=${encodeURIComponent(nextStore.id)}`
        )
      }

      const nextDashboard = await apiFetch<OwnerDashboard>(
        `/api/owner/stores/${nextStore.id}/tests`
      )
      setDashboard(nextDashboard)
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setErrorMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "운영 데이터를 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [pathname, requestedStoreId, router])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const currentTest = dashboard?.tests.find(
    (test) => test.status === "active" || test.status === "scheduled"
  )
  const progress = currentTest
    ? Math.round((currentTest.voteCount / currentTest.targetVotes) * 100)
    : 0

  if (isLoading) {
    return (
      <OwnerShell activeTab="dashboard">
        <DashboardMessage>운영 데이터를 불러오는 중...</DashboardMessage>
      </OwnerShell>
    )
  }

  if (errorMessage) {
    return (
      <OwnerShell activeTab="dashboard">
        <DashboardMessage>
          <p>{errorMessage}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
            onClick={() => void loadDashboard()}
          >
            다시 시도
          </button>
        </DashboardMessage>
      </OwnerShell>
    )
  }

  if (!selectedStore) {
    return (
      <OwnerShell activeTab="dashboard">
        <DashboardMessage>
          <p>등록된 매장이 없습니다.</p>
          <Link
            href="/owner/onboarding"
            className="mt-4 inline-flex rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
          >
            매장 등록하기
          </Link>
        </DashboardMessage>
      </OwnerShell>
    )
  }

  return (
    <OwnerShell activeTab="dashboard" storeId={selectedStore.id}>
      <section className="flex min-h-[700px] flex-1 flex-col px-5 pt-6 sm:px-8 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-12">
        <p className="text-xl font-black tracking-tight">THE PICK</p>
        <label className="mt-4 flex w-fit max-w-full items-center gap-2 text-sm text-[#adadb8]">
          <MapPinIcon
            className="size-4 shrink-0 text-[#0a85ff]"
            aria-hidden="true"
          />
          <span className="sr-only">매장 지역 선택</span>
          <select
            value={selectedStore.id}
            className="max-w-full appearance-none bg-transparent pr-4 text-sm font-semibold text-white outline-none"
            onChange={(event) =>
              router.push(
                `${pathname}?storeId=${encodeURIComponent(event.target.value)}`
              )
            }
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id} className="bg-[#1c1c1f]">
                {getRegionLabel(store.regionCode)} - {store.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] leading-tight font-semibold">진행 중</h1>
            <p className="mt-2 text-sm text-[#adadb8]">
              고객 반응을 수집하고 있는 테스트예요.
            </p>
          </div>
        </div>

        {currentTest ? (
          <article className="mt-9 rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4 md:mt-10 md:min-h-[352px] md:max-w-none md:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-[#0a85ff] px-2.5 py-1 text-[11px] font-semibold">
                {currentTest.status === "active" ? "진행 중" : "예약됨"}
              </span>
              <SecondaryLink
                href={`/owner/tests/${currentTest.id}?storeId=${selectedStore.id}`}
              >
                진행 현황 보기
              </SecondaryLink>
            </div>
            <h2 className="mt-5 text-lg font-semibold">{currentTest.title}</h2>
            <p className="mt-1 text-xs text-[#adadb8]">
              {formatDateRange(currentTest.startsAt, currentTest.endsAt)}
            </p>
            <p className="mt-12 text-[25px] font-semibold">
              {currentTest.voteCount} / {currentTest.targetVotes}명 참여
            </p>
            <p className="mt-1 text-[13px] text-[#adadb8]">
              {formatRemaining(currentTest.endsAt)}
            </p>
            <div className="mt-3">
              <ProgressBar value={progress} />
            </div>
            <div className="mt-12 grid grid-cols-3 gap-2 md:mt-14 md:max-w-[520px] md:gap-3">
              <MetricCard
                label="투표 수"
                value={`${currentTest.voteCount}명`}
              />
              <MetricCard
                label="목표 투표"
                value={`${currentTest.targetVotes}명`}
              />
              <MetricCard
                label="상태"
                value={currentTest.status === "active" ? "진행 중" : "예약됨"}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <PosterPlaceholder label="포스터 A" />
              <PosterPlaceholder label="포스터 B" variant="b" />
            </div>
          </article>
        ) : (
          <div className="mt-9 rounded-[18px] border border-dashed border-[#3d3d42] p-8 text-center text-sm text-[#adadb8]">
            진행 중인 테스트가 없습니다.
          </div>
        )}

        <Link
          href={`/owner/tests/new?storeId=${selectedStore.id}`}
          className="mt-auto mb-5 flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#0a85ff] text-[17px] font-semibold transition-colors hover:bg-[#0a85ff]/90 md:mb-8 md:w-fit md:min-w-[260px] md:self-end md:px-8"
        >
          A/B 테스트 추가하기
          <ArrowRightIcon className="size-5" aria-hidden="true" />
        </Link>
      </section>
    </OwnerShell>
  )
}

function DashboardMessage({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-[700px] flex-1 items-center justify-center px-6 text-center text-sm text-[#adadb8]">
      <div>{children}</div>
    </section>
  )
}

function formatDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  return `${start.toLocaleDateString("ko-KR")} ~ ${end.toLocaleDateString("ko-KR")}`
}

function formatRemaining(endsAt: string) {
  const remainingDays = Math.ceil(
    (new Date(endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  )
  return remainingDays > 0 ? `마감까지 ${remainingDays}일` : "마감 임박"
}
