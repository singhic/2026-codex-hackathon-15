import { Suspense } from "react"

import { OwnerDashboardClient } from "./owner-dashboard-client"

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<OwnerLoadingFallback />}>
      <OwnerDashboardClient />
    </Suspense>
  )
}

function OwnerLoadingFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
      불러오는 중...
    </main>
  )
}
