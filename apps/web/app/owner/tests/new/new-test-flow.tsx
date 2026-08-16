"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  InfoIcon,
} from "lucide-react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@workspace/ui/components/button"

import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type Catalog,
  type CreatedDraft,
  type StoreSummary,
} from "@/lib/api/client"
import { createClient } from "@/lib/supabase/client"

import {
  activeTest,
  posterAssets,
  votePackages,
} from "../../_components/mock-data"
import { OwnerShell } from "../../_components/owner-ui"

type NewTestFlowProps = {
  mode?: "new" | "edit"
}

type FlowStep = 1 | 2 | 3

const fieldClass =
  "h-11 w-full rounded-xl border border-[#3b3b40] bg-[#1c1c1e] px-3.5 text-[13px] text-white outline-none placeholder:text-[#adadb8] focus:border-[#0a85ff] focus:ring-1 focus:ring-[#0a85ff]"

type TestPeriod = {
  startDate: string
  endDate: string
}

const defaultTestPeriod: TestPeriod = {
  startDate: "2026-08-20",
  endDate: "2026-08-22",
}

const periodPresets = [
  { label: "1일", days: 1 },
  { label: "3일", days: 3 },
  { label: "5일", days: 5 },
  { label: "7일", days: 7 },
]

const dayInMilliseconds = 24 * 60 * 60 * 1000

function dateValueToUtc(value: string) {
  const parts = value.split("-").map(Number)
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    ![year, month, day].every(Number.isFinite)
  ) {
    return Number.NaN
  }

  return Date.UTC(year, month - 1, day)
}

function addDaysToDateValue(value: string, days: number) {
  const timestamp = dateValueToUtc(value)

  if (!Number.isFinite(timestamp)) return value

  return new Date(timestamp + days * dayInMilliseconds)
    .toISOString()
    .slice(0, 10)
}

function getPeriodDays(period: TestPeriod) {
  const start = dateValueToUtc(period.startDate)
  const end = dateValueToUtc(period.endDate)

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0
  }

  return Math.floor((end - start) / dayInMilliseconds) + 1
}

function formatPeriodDate(value: string) {
  const [, month, day] = value.split("-").map(Number)

  if (![month, day].every(Number.isFinite)) return "날짜 선택"

  return `${month}월 ${day}일`
}

function FlowButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit"
}) {
  return (
    <Button
      type={type}
      size="lg"
      className="h-12 w-full rounded-[14px] bg-[#0091ff] text-[15px] font-semibold text-white hover:bg-[#0091ff]/90"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function PosterUploadCard({
  label,
  fileName,
  inputId,
  imageSrc,
  highlighted = false,
  onChange,
}: {
  label: string
  fileName: string
  inputId: string
  imageSrc: string
  highlighted?: boolean
  onChange: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        className={`group relative flex h-[230px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border bg-[#29292e] text-sm text-[#adadb8] transition-colors hover:border-[#0a85ff] md:h-[300px] ${
          highlighted ? "border-[#ff5a36]" : "border-[#3b3b40]"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <Image
          src={imageSrc}
          alt={`포스터 ${label}`}
          fill
          sizes="(min-width: 768px) 360px, 50vw"
          className="object-contain"
        />
        <span className="absolute inset-x-4 bottom-3 rounded-xl bg-[#1c1c1e]/95 px-3 py-2 text-center text-xs font-semibold text-[#adadb8]">
          이미지 교체
        </span>
        {fileName ? (
          <span className="absolute top-3 right-3 max-w-[calc(100%-24px)] truncate rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
            {fileName}
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChange(file)
        }}
      />
      <button
        type="button"
        className="mt-2 h-7 w-full rounded-xl border border-[#3b3b40] bg-[#1c1c1e] text-xs font-semibold text-[#adadb8] transition-colors hover:border-[#0a85ff]"
        onClick={() => inputRef.current?.click()}
      >
        이미지 업로드
      </button>
    </div>
  )
}

function PosterStep({
  title,
  fileNames,
  question,
  onTitleChange,
  onQuestionChange,
  onFileChange,
  onNext,
}: {
  title: string
  fileNames: [string, string]
  question: string
  onTitleChange: (value: string) => void
  onQuestionChange: (value: string) => void
  onFileChange: (index: 0 | 1, file: File) => void
  onNext: () => void
}) {
  return (
    <form
      className="flex min-h-[calc(100svh-56px)] flex-1 flex-col px-5 pt-5 sm:px-8 md:mx-auto md:w-full md:max-w-3xl md:px-8 md:pt-10"
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
    >
      <label htmlFor="test-title" className="text-[13px] text-[#adadb8]">
        테스트 제목
      </label>
      <input
        id="test-title"
        className={`${fieldClass} mt-2`}
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        required
      />

      <p className="mt-5 text-[13px] text-[#adadb8]">포스터 A/B</p>
      <div className="mt-3 flex gap-5">
        <PosterUploadCard
          label="A"
          fileName={fileNames[0]}
          inputId="poster-a"
          imageSrc={posterAssets.a}
          highlighted
          onChange={(value) => onFileChange(0, value)}
        />
        <PosterUploadCard
          label="B"
          fileName={fileNames[1]}
          inputId="poster-b"
          imageSrc={posterAssets.b}
          onChange={(value) => onFileChange(1, value)}
        />
      </div>

      <label
        htmlFor="test-question"
        className="mt-7 text-[13px] text-[#adadb8]"
      >
        고객에게 보여줄 질문
      </label>
      <textarea
        id="test-question"
        className="mt-2 min-h-[74px] w-full resize-none rounded-xl border border-[#3b3b40] bg-[#1c1c1e] px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-[#adadb8] focus:border-[#0a85ff] focus:ring-1 focus:ring-[#0a85ff]"
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        required
      />

      <div className="mt-auto pt-8 pb-5">
        <FlowButton type="submit">
          다음
          <ArrowRightIcon aria-hidden="true" />
        </FlowButton>
      </div>
    </form>
  )
}

function ConditionStep({
  selectedVotes,
  period,
  packages,
  onSelectVotes,
  onChangePeriod,
  onNext,
}: {
  selectedVotes: number
  period: TestPeriod
  packages: Array<{ votes: number; price: number }>
  onSelectVotes: (votes: number) => void
  onChangePeriod: (period: TestPeriod) => void
  onNext: () => void
}) {
  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const selectedPackage =
    packages.find((item) => item.votes === selectedVotes) ?? packages.at(-1)!
  const periodDays = getPeriodDays(period)
  const totalPrice = selectedPackage.price * periodDays

  function selectPreset(days: number) {
    const startDate = period.startDate || defaultTestPeriod.startDate

    onChangePeriod({
      startDate,
      endDate: addDaysToDateValue(startDate, days - 1),
    })
  }

  function changeStartDate(startDate: string) {
    const days = periodDays || activeTest.days

    onChangePeriod({
      startDate,
      endDate: addDaysToDateValue(startDate, days - 1),
    })
  }

  return (
    <section className="flex min-h-[calc(100svh-56px)] flex-1 flex-col px-5 pt-5 sm:px-8 md:mx-auto md:w-full md:max-w-3xl md:px-8 md:pt-10">
      <h1 className="text-xl font-semibold">하루 최소 보장 투표 수</h1>
      <p className="mt-1 text-[13px] text-[#adadb8]">
        설정한 하루 최소 인원만큼 투표를 보장해 드려요.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {packages.map((item) => {
          const selected = item.votes === selectedVotes

          return (
            <button
              key={item.votes}
              type="button"
              className={`relative h-[62px] rounded-[14px] border px-3.5 text-left transition-colors ${
                selected
                  ? "border-[#0a85ff] bg-[#0a85ff]"
                  : "border-[#3d3d42] bg-[#1c1c1f] hover:border-[#0a85ff]"
              }`}
              aria-pressed={selected}
              onClick={() => onSelectVotes(item.votes)}
            >
              {selected ? (
                <CheckIcon
                  className="absolute top-2 right-2 size-4"
                  aria-hidden="true"
                />
              ) : null}
              <span className="block text-[17px] font-semibold">
                {item.votes}명
              </span>
              <span className="mt-0.5 block text-xs text-white/80">
                {item.price.toLocaleString("ko-KR")}원
              </span>
            </button>
          )
        })}
      </div>

      <h2 className="mt-6 text-[17px] font-semibold">테스트 운영 기간</h2>
      <div className="relative mt-2">
        <button
          type="button"
          className={`flex h-12 w-full items-center justify-between rounded-xl border bg-[#26262b] px-4 text-left text-[15px] transition-colors hover:border-[#0a85ff] ${
            isPeriodOpen ? "border-[#0a85ff]" : "border-transparent"
          }`}
          aria-expanded={isPeriodOpen}
          aria-controls="test-period-picker"
          onClick={() => setIsPeriodOpen((current) => !current)}
        >
          <span>
            {formatPeriodDate(period.startDate)}
            <span className="px-2 text-[#adadb8]">~</span>
            {formatPeriodDate(period.endDate)}
          </span>
          <ChevronDownIcon
            className={`size-4 text-[#adadb8] transition-transform ${
              isPeriodOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
        {isPeriodOpen ? (
          <div
            id="test-period-picker"
            className="absolute inset-x-0 top-[calc(100%+8px)] z-10 rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] p-4 shadow-2xl"
          >
            <p className="text-xs font-semibold text-[#adadb8]">
              빠른 기간 선택
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {periodPresets.map((preset) => {
                const selected = periodDays === preset.days

                return (
                  <button
                    key={preset.days}
                    type="button"
                    className={`h-9 rounded-lg border text-xs font-semibold transition-colors ${
                      selected
                        ? "border-[#0a85ff] bg-[#0a85ff] text-white"
                        : "border-[#3d3d42] text-[#adadb8] hover:border-[#0a85ff] hover:text-white"
                    }`}
                    aria-pressed={selected}
                    onClick={() => selectPreset(preset.days)}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[#adadb8]" htmlFor="start-date">
                시작일
                <input
                  id="start-date"
                  type="date"
                  className={`${fieldClass} mt-1 [color-scheme:dark]`}
                  value={period.startDate}
                  onChange={(event) => changeStartDate(event.target.value)}
                />
              </label>
              <label className="text-xs text-[#adadb8]" htmlFor="end-date">
                종료일
                <input
                  id="end-date"
                  type="date"
                  min={period.startDate}
                  className={`${fieldClass} mt-1 [color-scheme:dark]`}
                  value={period.endDate}
                  onChange={(event) =>
                    onChangePeriod({
                      ...period,
                      endDate: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="mt-4 h-10 w-full rounded-xl bg-[#26262b] text-sm font-semibold text-white transition-colors hover:bg-[#303036]"
              onClick={() => setIsPeriodOpen(false)}
            >
              선택 완료
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-[#adadb8]">
        매일 최소 보장 투표 수를 기준으로 운영됩니다.
      </p>

      <div className="mt-5 rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] p-4">
        <div className="flex items-center justify-between text-[15px] font-semibold">
          <span>예상 사용 금액</span>
          <span>총 {totalPrice.toLocaleString("ko-KR")}원</span>
        </div>
        <div className="mt-2 space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#adadb8]">하루 최소 보장</span>
            <span>{selectedVotes}명</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#adadb8]">하루 사용 금액</span>
            <span>{selectedPackage.price.toLocaleString("ko-KR")}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#adadb8]">운영 기간</span>
            <span>{periodDays}일</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl bg-[#1a334f] px-3.5 py-4">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2e7adb] text-sm font-semibold">
          <InfoIcon className="size-3.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold">
            최소 보장 인원 미달 시 비례 환급
          </p>
          <p className="mt-2 text-xs leading-5 text-[#adadb8]">
            하루 기준 최소 보장 투표 수를 채우지 못하면,
            <br />
            부족한 인원만큼 사용 금액을 비례 환급해 드립니다.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8 pb-5">
        <FlowButton onClick={onNext}>
          다음
          <ArrowRightIcon aria-hidden="true" />
        </FlowButton>
      </div>
    </section>
  )
}

function ConfirmStep({
  selectedVotes,
  period,
  packages,
  onConfirm,
  onCancel,
}: {
  selectedVotes: number
  period: TestPeriod
  packages: Array<{ votes: number; price: number }>
  onConfirm: () => void
  onCancel: () => void
}) {
  const selectedPackage =
    packages.find((item) => item.votes === selectedVotes) ?? packages.at(-1)!
  const periodDays = getPeriodDays(period)
  const totalPrice = selectedPackage.price * periodDays

  return (
    <div className="relative min-h-[calc(100svh-56px)] flex-1 px-5 pt-8">
      <h1 className="text-xl font-semibold">투표 조건 설정</h1>
      <div className="mt-5 h-[52px] rounded-[14px] bg-[#26262b]" />
      <div className="mt-4 h-[52px] rounded-[14px] bg-[#26262b]" />
      <div className="mt-4 h-[118px] rounded-[14px] bg-[#26262b]" />

      <div className="fixed inset-0 z-20 bg-black/60" aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto min-h-[562px] w-full max-w-[390px] rounded-t-[22px] bg-[#1c1c1f] px-5 pt-3 md:max-w-[560px] md:px-8"
      >
        <div className="mx-auto h-1.5 w-[70px] rounded-full bg-[#adadb8]" />
        <h2 id="confirm-title" className="mt-7 text-[22px] font-semibold">
          테스트를 시작할까요?
        </h2>
        <div className="mt-8 space-y-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[#adadb8]">하루 최소 보장 투표 수</span>
            <span className="font-semibold">{selectedVotes}명</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#adadb8]">운영 기간</span>
            <span className="text-right font-semibold">
              {formatPeriodDate(period.startDate)} ~{" "}
              {formatPeriodDate(period.endDate)}
              <br />
              {periodDays}일
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#adadb8]">하루 사용 금액</span>
            <span className="font-semibold">
              {selectedPackage.price.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
        <div className="mt-7 border-t border-[#3d3d42] pt-5">
          <div className="flex items-center justify-between font-semibold">
            <span>총 사용 금액</span>
            <span className="text-xl">
              {totalPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-5 space-y-5">
          <FlowButton onClick={onConfirm}>
            시작하기
            <ArrowRightIcon aria-hidden="true" />
          </FlowButton>
          <button
            type="button"
            className="block w-full text-center text-base font-semibold text-[#adadb8] transition-colors hover:text-white"
            onClick={onCancel}
          >
            취소
          </button>
        </div>
      </section>
    </div>
  )
}

export function NewTestFlow({ mode = "new" }: NewTestFlowProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedStoreId = searchParams.get("storeId")
  const editingTestId = pathname.match(/\/owner\/tests\/([^/]+)\/edit/)?.[1]
  const [step, setStep] = useState<FlowStep>(1)
  const [stores, setStores] = useState<StoreSummary[]>([])
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [isPreparing, setIsPreparing] = useState(true)
  const [title, setTitle] = useState(
    mode === "edit" ? activeTest.title : "신메뉴 딸기 라떼 홍보 포스터"
  )
  const [question, setQuestion] = useState(activeTest.question)
  const [files, setFiles] = useState<[File | null, File | null]>([null, null])
  const [fileNames, setFileNames] = useState<[string, string]>(["", ""])
  const [optionIds, setOptionIds] = useState<[string, string]>(["", ""])
  const [selectedVotes, setSelectedVotes] = useState(activeTest.dailyVotes)
  const [period, setPeriod] = useState<TestPeriod>(defaultTestPeriod)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)

  const selectedStore = useMemo(
    () =>
      stores.find((store) => store.id === requestedStoreId) ??
      stores[0] ??
      null,
    [requestedStoreId, stores]
  )
  const packages = useMemo(
    () =>
      catalog?.pricingPackages.map((item) => ({
        votes: item.targetVotes,
        price: item.priceCredits,
      })) ?? votePackages,
    [catalog]
  )
  const fileUploadState = useMemo(
    () => fileNames.filter(Boolean).length,
    [fileNames]
  )
  const headerTitle = mode === "edit" ? "테스트 수정" : "새 A/B 테스트 만들기"

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setIsPreparing(true)
      setErrorMessage(null)

      try {
        const [nextStores, nextCatalog] = await Promise.all([
          apiFetch<StoreSummary[]>("/api/owner/stores"),
          apiFetch<Catalog>("/api/catalog"),
        ])
        if (cancelled) return

        setStores(nextStores)
        setCatalog(nextCatalog)

        const nextStore =
          nextStores.find((store) => store.id === requestedStoreId) ??
          nextStores[0]
        if (!nextStore) {
          setErrorMessage("등록된 매장이 없습니다. 먼저 매장을 등록해 주세요.")
          return
        }

        if (nextStore.id !== requestedStoreId) {
          router.replace(
            `${pathname}?storeId=${encodeURIComponent(nextStore.id)}`
          )
        }

        const firstPackage = nextCatalog.pricingPackages.at(-1)
        if (firstPackage && mode === "new") {
          setSelectedVotes(firstPackage.targetVotes)
        }

        if (mode === "edit" && editingTestId) {
          const dashboard = await apiFetch<{
            tests: Array<{
              id: string
              title: string
              startsAt: string
              endsAt: string
              targetVotes: number
            }>
          }>(`/api/owner/stores/${nextStore.id}/tests`)
          const existingTest = dashboard.tests.find(
            (test) => test.id === editingTestId
          )
          if (existingTest) {
            setTitle(existingTest.title)
            setSelectedVotes(existingTest.targetVotes)
            setPeriod({
              startDate: existingTest.startsAt.slice(0, 10),
              endDate: existingTest.endsAt.slice(0, 10),
            })
          }

          const progress = await apiFetch<{
            options: Array<{ id: string; position: 1 | 2 }>
          }>(
            `/api/owner/stores/${nextStore.id}/tests/${editingTestId}/progress`
          )
          const sortedOptions = [...progress.options].sort(
            (a, b) => a.position - b.position
          )
          if (sortedOptions[0] && sortedOptions[1]) {
            setOptionIds([sortedOptions[0].id, sortedOptions[1].id])
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`)
          return
        }
        setErrorMessage(
          error instanceof ApiError
            ? getApiErrorMessage(error.code)
            : "테스트 설정을 불러오지 못했습니다."
        )
      } finally {
        if (!cancelled) setIsPreparing(false)
      }
    }

    void loadData()
    return () => {
      cancelled = true
    }
  }, [editingTestId, mode, pathname, requestedStoreId, router])

  async function uploadPoster(
    storeId: string,
    testId: string,
    optionId: string,
    file: File
  ) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("FILE_TOO_LARGE")
    }

    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }
    const extension = extensionByType[file.type]
    if (!extension) throw new Error("UNSUPPORTED_FILE_TYPE")

    const { assetPath } = await apiFetch<{ assetPath: string }>(
      `/api/owner/stores/${storeId}/tests/${testId}/options/${optionId}`,
      {
        method: "POST",
        body: JSON.stringify({ extension }),
      }
    )
    const supabase = createClient()
    const { error } = await supabase.storage
      .from("test-posters")
      .upload(assetPath, file, { contentType: file.type, upsert: false })
    if (error) throw new Error("ASSET_UPLOAD_FAILED")

    await apiFetch(
      `/api/owner/stores/${storeId}/tests/${testId}/options/${optionId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ assetPath }),
      }
    )
  }

  async function handleConfirm() {
    if (!selectedStore) return
    if (!files[0] || !files[1]) {
      setErrorMessage("A와 B 포스터 이미지를 모두 업로드해 주세요.")
      setStep(1)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const startsAt = toIsoDate(period.startDate)
      const endsAt = toIsoDate(period.endDate, true)
      const body = {
        title,
        question,
        startsAt,
        endsAt,
        targetVotes: selectedVotes,
        rewardPoints: 10,
      }
      let testId = editingTestId
      let nextOptionIds = optionIds

      if (mode === "edit" && testId) {
        await apiFetch(
          `/api/owner/stores/${selectedStore.id}/tests/${testId}`,
          { method: "PATCH", body: JSON.stringify(body) }
        )
      } else {
        const draft = await apiFetch<CreatedDraft>(
          `/api/owner/stores/${selectedStore.id}/tests`,
          { method: "POST", body: JSON.stringify(body) }
        )
        testId = draft.id
        nextOptionIds = [draft.optionAId, draft.optionBId]
        setOptionIds(nextOptionIds)
      }

      if (!testId || !nextOptionIds[0] || !nextOptionIds[1]) {
        throw new Error("DRAFT_OPTIONS_MISSING")
      }

      await Promise.all([
        uploadPoster(selectedStore.id, testId, nextOptionIds[0], files[0]),
        uploadPoster(selectedStore.id, testId, nextOptionIds[1], files[1]),
      ])

      const key = idempotencyKey ?? crypto.randomUUID()
      if (!idempotencyKey) setIdempotencyKey(key)
      await apiFetch(
        `/api/owner/stores/${selectedStore.id}/tests/${testId}/start`,
        {
          method: "POST",
          body: JSON.stringify({ idempotencyKey: key }),
        }
      )
      router.push(`/owner/tests/${testId}?storeId=${selectedStore.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      const message =
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : error instanceof Error && error.message === "FILE_TOO_LARGE"
            ? "이미지는 5MB 이하로 업로드해 주세요."
            : error instanceof Error &&
                error.message === "UNSUPPORTED_FILE_TYPE"
              ? "JPG, PNG, WebP 이미지만 업로드할 수 있습니다."
              : "테스트를 저장하거나 시작하지 못했습니다. 다시 시도해 주세요."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPreparing) {
    return (
      <OwnerShell showTabs={false} headerTitle={headerTitle}>
        <div className="flex min-h-[700px] items-center justify-center text-sm text-[#adadb8]">
          테스트 설정을 불러오는 중...
        </div>
      </OwnerShell>
    )
  }

  if (!selectedStore || !catalog) {
    return (
      <OwnerShell showTabs={false} headerTitle={headerTitle}>
        <div className="flex min-h-[700px] flex-col items-center justify-center px-6 text-center text-sm text-[#adadb8]">
          <p>{errorMessage ?? "매장 정보를 찾을 수 없습니다."}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-[#0a85ff] px-5 py-3 font-semibold text-white"
            onClick={() => router.push("/owner/onboarding")}
          >
            매장 등록하기
          </button>
        </div>
      </OwnerShell>
    )
  }

  return (
    <OwnerShell
      showTabs={false}
      backHref={
        mode === "edit"
          ? `/owner/tests/${editingTestId}?storeId=${selectedStore.id}`
          : `/owner/tests?storeId=${selectedStore.id}`
      }
      headerTitle={headerTitle}
    >
      {errorMessage ? (
        <div
          className="mx-5 mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200 sm:mx-8 md:mx-auto md:w-full md:max-w-3xl"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}
      {step === 1 ? (
        <PosterStep
          title={title}
          fileNames={fileNames}
          question={question}
          onTitleChange={setTitle}
          onQuestionChange={setQuestion}
          onFileChange={(index, file) => {
            setFiles((current) => {
              const next: [File | null, File | null] = [...current]
              next[index] = file
              return next
            })
            setFileNames((current) => {
              const next: [string, string] = [...current]
              next[index] = file.name
              return next
            })
          }}
          onNext={() => setStep(2)}
        />
      ) : null}
      {step === 2 ? (
        <ConditionStep
          selectedVotes={selectedVotes}
          period={period}
          packages={packages}
          onSelectVotes={setSelectedVotes}
          onChangePeriod={setPeriod}
          onNext={() => setStep(3)}
        />
      ) : null}
      {step === 3 ? (
        <ConfirmStep
          selectedVotes={selectedVotes}
          period={period}
          packages={packages}
          onCancel={() => setStep(2)}
          onConfirm={() => void handleConfirm()}
        />
      ) : null}
      {isSubmitting ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6 text-center text-sm text-white">
          테스트와 포스터를 저장하는 중입니다...
        </div>
      ) : null}
      {fileUploadState > 0 ? (
        <span className="sr-only">{fileUploadState}개의 포스터가 등록됨</span>
      ) : null}
    </OwnerShell>
  )
}

function toIsoDate(value: string, endOfDay = false) {
  const time = endOfDay ? "23:59:59" : "00:00:00"
  return new Date(`${value}T${time}+09:00`).toISOString()
}
