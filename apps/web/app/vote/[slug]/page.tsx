import { Suspense } from "react"

import { VoteClient } from "./vote-client"

type VotePageProps = {
  params: Promise<{ slug: string }>
}

export default async function VotePage({ params }: VotePageProps) {
  const { slug } = await params
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-black text-sm text-white">
          투표 정보를 불러오는 중...
        </main>
      }
    >
      <VoteClient slug={slug} />
    </Suspense>
  )
}
