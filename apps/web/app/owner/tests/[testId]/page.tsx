import { Suspense } from "react"

import { OwnerTestClient } from "./owner-test-client"

type TestPageProps = {
  params: Promise<{ testId: string }>
}

export default async function OwnerTestPage({ params }: TestPageProps) {
  const { testId } = await params
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
          불러오는 중...
        </main>
      }
    >
      <OwnerTestClient testId={testId} />
    </Suspense>
  )
}
