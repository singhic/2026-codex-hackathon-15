import { Suspense } from "react"

import { OwnerWalletClient } from "./owner-wallet-client"

export default function OwnerWalletPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
          불러오는 중...
        </main>
      }
    >
      <OwnerWalletClient />
    </Suspense>
  )
}
