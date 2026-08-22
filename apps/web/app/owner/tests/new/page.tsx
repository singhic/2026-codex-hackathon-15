import { Suspense } from "react"
import { connection } from "next/server"

import { createDefaultTestPeriod } from "@/lib/test-period"

import { NewTestFlow } from "./new-test-flow"

export default async function NewOwnerTestPage() {
  await connection()

  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
          불러오는 중...
        </main>
      }
    >
      <NewTestFlow initialPeriod={createDefaultTestPeriod()} />
    </Suspense>
  )
}
