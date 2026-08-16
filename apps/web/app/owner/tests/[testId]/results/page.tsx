import { Suspense } from "react"

import { OwnerResultsClient } from "./owner-results-client"

type ResultsPageProps = {
  params: Promise<{ testId: string }>
}

export default async function OwnerResultsPage({ params }: ResultsPageProps) {
  const { testId } = await params
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
          불러오는 중...
        </main>
      }
    >
      <OwnerResultsClient testId={testId} />
    </Suspense>
  )
}
