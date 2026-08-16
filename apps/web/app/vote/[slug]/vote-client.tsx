"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type VoteContext,
} from "@/lib/api/client"

export function VoteClient({ slug }: { slug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const detailViewRecorded = useRef(false)
  const [context, setContext] = useState<VoteContext | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadContext = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const nextContext = await apiFetch<VoteContext>(`/api/vote/${slug}`)
      setContext(nextContext)
      if (!detailViewRecorded.current) {
        detailViewRecorded.current = true
        void apiFetch(`/api/vote/${slug}/detail-view`, { method: "POST" })
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setErrorMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "투표 정보를 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router, slug])

  useEffect(() => {
    void loadContext()
  }, [loadContext])

  async function submitVote() {
    if (!context || !selectedOptionId || isSubmitting) return
    const key = idempotencyKey ?? crypto.randomUUID()
    if (!idempotencyKey) setIdempotencyKey(key)
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await apiFetch(`/api/vote/${slug}`, {
        method: "POST",
        body: JSON.stringify({
          optionId: selectedOptionId,
          idempotencyKey: key,
        }),
      })
      router.push(`/vote/${encodeURIComponent(slug)}/complete`)
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      if (error instanceof ApiError && error.code === "CONSENT_REQUIRED") {
        router.push(
          `/onboarding?role=guest&next=${encodeURIComponent(pathname)}`
        )
        return
      }
      if (error instanceof ApiError && error.code === "ALREADY_VOTED") {
        router.push(`/vote/${encodeURIComponent(slug)}/complete`)
        return
      }
      setErrorMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "투표를 제출하지 못했습니다. 다시 시도해 주세요."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <VoteMessage>투표 정보를 불러오는 중...</VoteMessage>

  if (!context) {
    return (
      <VoteMessage>
        <p>{errorMessage ?? "투표를 표시할 수 없습니다."}</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
          onClick={() => void loadContext()}
        >
          다시 시도
        </button>
      </VoteMessage>
    )
  }

  if (context.alreadyVoted || context.status === "completed") {
    return (
      <VoteMessage>
        <p>
          {context.alreadyVoted
            ? "이미 참여한 투표입니다."
            : "투표가 완료되었습니다."}
        </p>
        <Link
          href={`/vote/${encodeURIComponent(slug)}/complete`}
          className="mt-4 inline-flex rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
        >
          결과 보기
        </Link>
      </VoteMessage>
    )
  }

  const canVote = context.status === "active" && !context.ownedByCurrentUser

  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto flex min-h-svh w-full max-w-[620px] flex-col bg-black px-5 py-7 sm:px-8 md:my-10 md:min-h-0 md:rounded-[18px] md:px-10 md:py-10">
        <header className="flex items-center gap-2">
          <button
            type="button"
            aria-label="이전 화면"
            className="inline-flex size-7 items-center justify-center"
            onClick={() => router.back()}
          >
            <ChevronLeftIcon className="size-6" aria-hidden="true" />
          </button>
          <div>
            <p className="text-lg font-semibold">{context.storeName}</p>
            <p className="text-xs text-[#adadb8]">고객 투표</p>
          </div>
        </header>

        <section className="flex flex-1 flex-col pt-12">
          <span className="w-fit rounded-full bg-[#1a334f] px-3 py-1 text-xs font-semibold text-[#80c4ff]">
            {context.status === "scheduled" ? "시작 전" : "투표 진행 중"}
          </span>
          <h1 className="mt-5 text-[28px] leading-tight font-semibold">
            {context.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#adadb8]">
            {context.question}
          </p>

          {context.status === "scheduled" ? (
            <div className="mt-10 rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] px-4 py-5 text-sm text-[#adadb8]">
              투표가 시작되면 이 화면에서 포스터를 선택할 수 있어요.
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-2 gap-4">
            {context.options.map((option) => {
              const selected = selectedOptionId === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!canVote}
                  className={`relative overflow-hidden rounded-2xl border text-left transition-colors ${
                    selected
                      ? "border-[#0a85ff] ring-2 ring-[#0a85ff]"
                      : "border-[#3d3d42]"
                  } ${!canVote ? "cursor-not-allowed opacity-60" : "hover:border-[#0a85ff]"}`}
                  onClick={() => setSelectedOptionId(option.id)}
                >
                  <VotePoster
                    label={`포스터 ${option.position === 1 ? "A" : "B"}`}
                    src={option.assetUrl}
                  />
                  {selected ? (
                    <span className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-[#0a85ff]">
                      <CheckIcon className="size-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  <span className="block px-3 py-3 text-center text-sm font-semibold">
                    {option.position === 1 ? "A안" : "B안"}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-6 text-sm text-[#80c4ff]">
            투표 참여 보상 {context.rewardPoints}P
          </p>
          {context.ownedByCurrentUser ? (
            <p className="mt-3 rounded-xl bg-[#26262b] px-4 py-3 text-sm text-[#adadb8]">
              내 매장 테스트에는 투표할 수 없습니다.
            </p>
          ) : null}
          {errorMessage ? (
            <p
              className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!canVote || !selectedOptionId || isSubmitting}
            className="mt-auto h-14 w-full rounded-2xl bg-[#0a85ff] text-[17px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void submitVote()}
          >
            {isSubmitting ? "제출 중..." : "선택하고 투표하기"}
            {!isSubmitting ? (
              <ArrowRightIcon
                className="ml-2 inline size-5"
                aria-hidden="true"
              />
            ) : null}
          </button>
        </section>
      </div>
    </main>
  )
}

function VotePoster({ label, src }: { label: string; src?: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-[240px] items-center justify-center bg-[#111114] bg-contain bg-center bg-no-repeat text-sm text-[#adadb8]"
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    >
      {!src ? label : null}
    </div>
  )
}

function VoteMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black px-6 text-center text-sm text-[#adadb8]">
      <div>{children}</div>
    </main>
  )
}
