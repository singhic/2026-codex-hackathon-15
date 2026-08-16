import { Layers3Icon } from "lucide-react"
import { redirect } from "next/navigation"

import { ModeToggle } from "@/components/mode-toggle"
import { createClient } from "@/lib/supabase/server"

import { OnboardingForm } from "./onboarding-form"

export default async function OwnerOnboardingPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const ownerId = claimsData?.claims.sub

  if (!ownerId) {
    redirect("/login?next=%2Fowner%2Fonboarding")
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
              <p className="text-xs text-muted-foreground">매장 시작하기</p>
            </div>
          </div>
          <ModeToggle />
        </header>

        <section className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <OnboardingForm />
        </section>
      </div>
    </main>
  )
}
