"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, MapPinIcon, PlusIcon } from "lucide-react"
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

import { OwnerShell, PosterPlaceholder } from "../_components/owner-ui"

type OwnerTestsView = "tests" | "picks"

export function OwnerTestsClient({ view = "tests" }: { view?: OwnerTestsView }) {
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

  const loadTests = useCallback(async () => {
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

      setDashboard(
        await apiFetch<OwnerDashboard>(
          `/api/owner/stores/${nextStore.id}/tests`
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
          : "테스트 목록을 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [pathname, requestedStoreId, router])

  useEffect(() => {
    void loadTests()
  }, [loadTests])

  if (isLoading) {
    return (
      <OwnerShell activeTab={view}>
        <Message>목록을 불러오는 중...</Message>
      </OwnerShell>
    )
  }

  if (errorMessage) {
    return (
      <OwnerShell activeTab={view}>
        <Message>
          <p>{errorMessage}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
            onClick={() => void loadTests()}
          >
            다시 시도
          </button>
        </Message>
      </OwnerShell>
    )
  }

  if (!selectedStore) {
    return (
      <OwnerShell activeTab={view}>
        <Message>
          <p>등록된 매장이 없습니다.</p>
          <Link
            href="/owner/onboarding"
            className="mt-4 inline-flex rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
          >
            매장 등록하기
          </Link>
        </Message>
      </OwnerShell>
    )
  }

  const visibleTests =
    dashboard?.tests.filter((test) =>
      view === "picks" ? test.status === "completed" : test.status !== "completed"
    ) ?? []

  return (
    <OwnerShell activeTab={view} storeId={selectedStore.id}>
      <section className="flex flex-1 flex-col px-5 pt-7 sm:px-8 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base text-[#adadb8]">
              사장님 운영 공간
            </p>
            <h1 className="mt-4 text-[30px] leading-none font-semibold">
              {view === "picks" ? "완료 리포트" : "내 테스트"}
            </h1>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 rounded-full border border-[#0a85ff] px-3 py-1 text-[13px] font-medium text-[#0a85ff]">
              사장님
            </span>
            {view === "tests" ? (
              <Link
                href={`/owner/tests/new?storeId=${selectedStore.id}`}
                aria-label="새 테스트 만들기"
                className="inline-flex size-16 items-center justify-center rounded-full bg-[#0a85ff] text-white transition-colors hover:bg-[#2b9bff]"
              >
                <PlusIcon className="size-8" strokeWidth={2} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>

        {stores.length > 1 ? (
          <label className="mt-6 flex w-fit max-w-full items-center gap-2 text-sm text-[#adadb8]">
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
                <option
                  key={store.id}
                  value={store.id}
                  className="bg-[#1c1c1f]"
                >
                  {getRegionLabel(store.regionCode)} - {store.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {visibleTests.length ? (
          <div className="mt-16 grid gap-4 pb-8 md:grid-cols-2 md:gap-5">
            {visibleTests.map((test) => (
              <Link
                key={test.id}
                href={
                  view === "picks"
                    ? `/owner/tests/${test.id}/results?storeId=${selectedStore.id}`
                    : `/owner/tests/${test.id}?storeId=${selectedStore.id}`
                }
                className="block rounded-[26px] border border-[#3d3d42] bg-[#1c1c1f] p-6 transition-colors hover:border-[#0a85ff] md:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#0a85ff] px-3 py-2 text-[13px] font-semibold text-white">
                    {view === "picks" ? "완료 리포트" : getStatusLabel(test.status)}
                  </span>
                  <ArrowRightIcon
                    className="size-7 text-[#adadb8]"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-7 text-[22px] font-semibold">{test.title}</p>
                <p className="mt-2 text-[17px] text-[#adadb8]">
                  {test.voteCount} / {test.targetVotes}명 참여
                </p>
                <p className="mt-1 text-sm text-[#adadb8]">
                  {formatDateRange(test.startsAt, test.endsAt)}
                </p>
                <div className="mt-7 grid grid-cols-2 gap-5">
                  <PosterPlaceholder label="포스터 A" />
                  <PosterPlaceholder label="포스터 B" variant="b" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[18px] border border-dashed border-[#3d3d42] p-10 text-center text-sm text-[#adadb8]">
            {view === "picks"
              ? "아직 완료된 리포트가 없습니다."
              : "등록된 테스트가 없습니다."}
          </div>
        )}
      </section>
    </OwnerShell>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-[700px] flex-1 items-center justify-center px-6 text-center text-sm text-[#adadb8]">
      <div>{children}</div>
    </section>
  )
}

function formatDateRange(startsAt: string, endsAt: string) {
  return `${new Date(startsAt).toLocaleDateString("ko-KR")} ~ ${new Date(endsAt).toLocaleDateString("ko-KR")}`
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "진행 중"
    case "scheduled":
      return "예약됨"
    case "draft":
      return "초안"
    case "cancelled":
      return "취소됨"
    default:
      return "테스트"
  }
}
