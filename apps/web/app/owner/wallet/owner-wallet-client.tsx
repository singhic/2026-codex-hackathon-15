"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeftIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type OwnerWallet,
} from "@/lib/api/client"

export function OwnerWalletClient() {
  const router = useRouter()
  const pathname = usePathname()
  const [wallet, setWallet] = useState<OwnerWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const loadWallet = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      setWallet(await apiFetch<OwnerWallet>("/api/owner/wallet"))
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "크레딧 내역을 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router])

  useEffect(() => {
    void loadWallet()
  }, [loadWallet])

  if (isLoading) return <WalletMessage>크레딧을 불러오는 중...</WalletMessage>

  if (!wallet) {
    return (
      <WalletMessage>
        <p>{message ?? "크레딧 정보를 표시할 수 없습니다."}</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
          onClick={() => void loadWallet()}
        >
          다시 시도
        </button>
      </WalletMessage>
    )
  }

  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto min-h-svh w-full max-w-[620px] bg-black px-5 py-7 sm:px-8 md:my-10 md:min-h-0 md:rounded-[18px] md:px-10 md:py-10">
        <header className="flex items-center gap-2">
          <button
            type="button"
            aria-label="대시보드로 돌아가기"
            className="inline-flex size-7 items-center justify-center"
            onClick={() => router.back()}
          >
            <ChevronLeftIcon className="size-6" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-semibold">운영자 크레딧</h1>
        </header>

        <section className="mt-10 rounded-2xl bg-[#1a334f] px-5 py-6">
          <p className="text-sm text-[#adadb8]">사용 가능한 잔액</p>
          <p className="mt-2 text-4xl font-semibold">{wallet.balance}</p>
          <p className="mt-1 text-xs text-[#adadb8]">크레딧</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">최근 내역</h2>
          {wallet.entries.length ? (
            <ul className="mt-3 space-y-2">
              {wallet.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-[#3d3d42] bg-[#1c1c1f] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {getEntryLabel(entry.type)}
                    </p>
                    <p className="mt-1 text-xs text-[#adadb8]">
                      {new Date(entry.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${entry.amount >= 0 ? "text-[#80c4ff]" : "text-white"}`}
                  >
                    {entry.amount > 0 ? "+" : ""}
                    {entry.amount}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-[#3d3d42] px-4 py-5 text-sm text-[#adadb8]">
              아직 크레딧 내역이 없습니다.
            </p>
          )}
        </section>
        <p className="mt-8 text-xs leading-5 text-[#adadb8]">
          크레딧 충전과 관리자 지급 API는 아직 제공되지 않습니다.
        </p>
      </div>
    </main>
  )
}

function WalletMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black px-6 text-center text-sm text-[#adadb8]">
      <div>{children}</div>
    </main>
  )
}

function getEntryLabel(type: string) {
  switch (type) {
    case "admin_grant":
      return "관리자 지급"
    case "test_charge":
      return "테스트 사용"
    case "test_refund":
      return "테스트 환급"
    default:
      return "조정"
  }
}
