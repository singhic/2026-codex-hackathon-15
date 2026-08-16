"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type PublicResult,
  type RewardWallet,
} from "@/lib/api/client"

export function VoteCompleteClient({ slug }: { slug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [result, setResult] = useState<PublicResult | null>(null)
  const [rewards, setRewards] = useState<RewardWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const [nextResult, nextRewards] = await Promise.all([
        apiFetch<PublicResult>(`/api/vote/${slug}/result`),
        apiFetch<RewardWallet>("/api/me/rewards"),
      ])
      setResult(nextResult)
      setRewards(nextRewards)
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "결과를 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router, slug])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (isLoading) return <Message>결과를 불러오는 중...</Message>

  if (!result || !rewards) {
    return (
      <Message>
        <p>{message ?? "아직 결과를 확인할 수 없습니다."}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            className="rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
            onClick={() => void loadData()}
          >
            다시 확인
          </button>
          <Link
            href={`/vote/${encodeURIComponent(slug)}`}
            className="rounded-xl border border-[#3d3d42] px-5 py-3 text-sm font-semibold text-white"
          >
            투표로 돌아가기
          </Link>
        </div>
      </Message>
    )
  }

  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto min-h-svh w-full max-w-[620px] bg-black px-5 py-7 sm:px-8 md:my-10 md:min-h-0 md:rounded-[18px] md:px-10 md:py-10">
        <p className="text-sm font-semibold text-[#80c4ff]">투표 완료</p>
        <h1 className="mt-4 text-[28px] leading-tight font-semibold">
          선택해 주셔서 감사합니다.
        </h1>
        <p className="mt-3 text-sm text-[#adadb8]">{result.title}</p>

        <div className="mt-8 rounded-2xl bg-[#1a334f] px-5 py-5">
          <p className="text-sm text-[#adadb8]">내 포인트 잔액</p>
          <p className="mt-2 text-3xl font-semibold">{rewards.balance}P</p>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">현재 결과</h2>
            <span className="text-sm text-[#adadb8]">
              총 {result.voteCount}표
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {result.options.map((option) => (
              <div key={option.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>포스터 {option.position === 1 ? "A" : "B"}</span>
                  <span>{option.percentage}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#26262b]">
                  <div
                    className="h-full rounded-full bg-[#0a85ff]"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/me"
          className="mt-10 flex h-14 items-center justify-center rounded-2xl bg-[#0a85ff] text-[17px] font-semibold"
        >
          내 투표 홈으로 이동
        </Link>
      </div>
    </main>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black px-6 text-center text-sm text-[#adadb8]">
      <div>{children}</div>
    </main>
  )
}
