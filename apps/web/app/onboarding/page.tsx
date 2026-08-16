import { Suspense } from "react"

import { OnboardingClient } from "./onboarding-client"

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
          불러오는 중...
        </main>
      }
    >
      <OnboardingClient />
    </Suspense>
  )
}
