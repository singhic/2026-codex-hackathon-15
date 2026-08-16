"use client"

import { useState } from "react"
import { ChevronLeftIcon, LogOutIcon, StoreIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"

import { createClient } from "@/lib/supabase/client"

export function AccountClient() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function signOut() {
    setIsSigningOut(true)
    setErrorMessage(null)
    try {
      const { error } = await createClient().auth.signOut()
      if (error) throw error
      router.replace("/login")
    } catch {
      setErrorMessage("로그아웃하지 못했습니다. 다시 시도해 주세요.")
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto min-h-svh w-full max-w-[620px] bg-black px-5 py-7 sm:px-8 md:my-10 md:min-h-0 md:rounded-[18px] md:px-10 md:py-10">
        <header className="flex items-center gap-2">
          <button
            type="button"
            aria-label="내 홈으로 돌아가기"
            className="inline-flex size-7 items-center justify-center"
            onClick={() => router.back()}
          >
            <ChevronLeftIcon className="size-6" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-semibold">계정 설정</h1>
        </header>

        <section className="mt-12 rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1a334f] text-[#80c4ff]">
              <StoreIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">사장님으로도 이용하기</h2>
              <p className="mt-2 text-sm leading-6 text-[#adadb8]">
                매장을 등록하고 포스터 테스트와 완료 리포트를 관리할 수 있어요.
              </p>
            </div>
          </div>
          <Button
            className="mt-6 h-12 w-full rounded-xl bg-[#0a85ff] text-white hover:bg-[#0a85ff]/90"
            render={
              <Link href="/onboarding?role=owner&returnTo=/owner/onboarding" />
            }
          >
            사장님 역할 추가하기
          </Button>
        </section>

        <section className="mt-6 rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] p-5">
          <h2 className="text-lg font-semibold">로그아웃</h2>
          <p className="mt-2 text-sm leading-6 text-[#adadb8]">
            현재 기기의 Supabase 세션을 종료합니다.
          </p>
          {errorMessage ? (
            <p className="mt-4 text-sm text-red-200" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={isSigningOut}
            className="mt-6 h-12 w-full rounded-xl bg-[#26262b] text-white hover:bg-[#313138]"
            onClick={() => void signOut()}
          >
            <LogOutIcon className="size-4" aria-hidden="true" />
            {isSigningOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </section>
      </div>
    </main>
  )
}
