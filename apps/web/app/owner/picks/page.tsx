import { Suspense } from "react"

import { OwnerTestsClient } from "../tests/owner-tests-client"

export default function OwnerPicksPage() {
  return (
    <Suspense fallback={<OwnerPicksLoadingFallback />}>
      <OwnerTestsClient view="picks" />
    </Suspense>
  )
}

function OwnerPicksLoadingFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
      불러오는 중...
    </main>
  )
}
