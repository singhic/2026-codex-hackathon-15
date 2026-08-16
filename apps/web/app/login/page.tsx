import { Layers3Icon } from "lucide-react"
import { redirect } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ModeToggle } from "@/components/mode-toggle"
import { getSafeNextPath } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/server"

import { GoogleLoginButton } from "./google-login-button"

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[]
    next?: string | string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams
  const nextPath = getSafeNextPath(Array.isArray(next) ? next[0] : next)
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (claimsData?.claims) {
    redirect(nextPath)
  }

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-5xl flex-col sm:min-h-[calc(100svh-4rem)]">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
              <Layers3Icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">15 Fullstack</p>
              <p className="text-xs text-muted-foreground">A/B Test Studio</p>
            </div>
          </div>
          <ModeToggle />
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_420px] lg:py-16">
          <div className="max-w-xl space-y-5">
            <p className="text-sm font-medium text-muted-foreground">
              포스터 선택을 데이터로 확인하세요
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              고객이 선택한 포스터로 더 나은 결정을 만드세요.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              두 개의 포스터를 등록하고 투표 링크를 공유하면 결과를 한눈에
              비교할 수 있습니다.
            </p>
          </div>

          <Card className="w-full shadow-sm">
            <CardHeader className="gap-2 border-b pb-5">
              <CardTitle className="text-xl">로그인</CardTitle>
              <CardDescription>
                Google 계정으로 빠르게 시작할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-1">
              {error ? (
                <p
                  className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                  role="alert"
                >
                  로그인을 완료하지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}
              <GoogleLoginButton nextPath={nextPath} />
              <p className="text-center text-xs leading-5 text-muted-foreground">
                계속하면 서비스 이용약관과 개인정보처리방침에 동의한 것으로
                간주합니다.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
