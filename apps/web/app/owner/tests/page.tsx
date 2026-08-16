import { Suspense } from "react"

import { OwnerTestsClient } from "./owner-tests-client"

export default function OwnerTestsPage() {
  return (
    <Suspense fallback={<OwnerTestsLoadingFallback />}>
      <OwnerTestsClient />
    </Suspense>
  )
}

function OwnerTestsLoadingFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
      불러오는 중...
    </main>
  )
}
