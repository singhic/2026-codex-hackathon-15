import { CircleCheckIcon, Layers3Icon, TerminalIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@workspace/ui/components/card"
import { ModeToggle } from "@/components/mode-toggle"

export default function Page() {
  return (
    <main className="min-h-svh bg-muted/30">
      <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
              <Layers3Icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">15 Fullstack</p>
              <p className="text-xs text-muted-foreground">
                Next.js + Supabase
              </p>
            </div>
          </div>
          <ModeToggle />
        </header>

        <section
          className="flex flex-1 items-center py-12 sm:py-16"
          aria-labelledby="ready-title"
        >
          <Card className="w-full max-w-2xl">
            <CardHeader className="gap-3 border-b pb-5">
              <div className="flex w-fit items-center gap-2 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                <CircleCheckIcon className="size-3.5" aria-hidden="true" />
                개발 환경 준비됨
              </div>
              <div className="space-y-2">
                <h1
                  id="ready-title"
                  className="text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  15 Fullstack Boilerplate
                </h1>
                <CardDescription className="max-w-xl leading-relaxed">
                  Next.js Route Handler와 Supabase, Tailwind CSS, 공유 shadcn/ui
                  패키지를 기반으로 프론트엔드와 서버 개발을 함께 시작할 수
                  있습니다.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-1">
              <ul className="grid gap-3 sm:grid-cols-3" aria-label="구성 상태">
                {[
                  ["Next.js", "App Router + API"],
                  ["Supabase", "Database + Auth"],
                  ["shadcn/ui", "Shared UI"],
                ].map(([name, detail]) => (
                  <li
                    key={name}
                    className="rounded-lg border bg-background p-3"
                  >
                    <p className="font-medium">{name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {detail}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3 font-mono text-sm">
                <TerminalIcon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <code>pnpm dev</code>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
