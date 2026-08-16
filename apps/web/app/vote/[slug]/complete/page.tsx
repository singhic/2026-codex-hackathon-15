import { VoteCompleteClient } from "./vote-complete-client"

type CompletePageProps = {
  params: Promise<{ slug: string }>
}

export default async function VoteCompletePage({ params }: CompletePageProps) {
  const { slug } = await params
  return <VoteCompleteClient slug={slug} />
}
