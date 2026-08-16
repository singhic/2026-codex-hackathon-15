import { ArrowRightIcon, Layers3Icon } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { ModeToggle } from "@/components/mode-toggle"

export default function Page() {
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

        <section
          className="flex flex-1 items-center py-16 sm:py-20"
          aria-labelledby="hero-title"
        >
          <div className="max-w-3xl space-y-6">
            <p className="text-sm font-medium text-muted-foreground">
              포스터 선택을 데이터로 확인하세요
            </p>
            <h1
              id="hero-title"
              className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
            >
              고객이 고른 포스터로, 더 확신 있게 홍보하세요.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              두 개의 포스터를 등록하고 고객에게 공유하면 실제 선택 결과를
              한눈에 비교할 수 있습니다.
            </p>
            <Button
              size="lg"
              className="h-11 px-4 text-sm"
              render={<Link href="/login" />}
            >
              Google로 시작하기
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
