import { ArrowRightIcon, PencilIcon } from "lucide-react"
import Link from "next/link"

import { activeTest, posterAssets } from "../../_components/mock-data"
import {
  MetricCard,
  OwnerShell,
  PosterPlaceholder,
} from "../../_components/owner-ui"

type TestPageProps = {
  params: Promise<{ testId: string }>
}

export default async function OwnerTestPage({ params }: TestPageProps) {
  const { testId } = await params
  const test = testId === activeTest.id ? activeTest : activeTest
  const progress = Math.round((test.votes / test.targetVotes) * 100)

  return (
    <OwnerShell
      showTabs={false}
      backHref="/owner/tests"
      headerTitle={test.title}
      headerAction={
        <Link
          href={`/owner/tests/${test.id}/edit`}
          className="text-base font-semibold text-[#0a85ff]"
        >
          수정
        </Link>
      }
    >
      <section className="flex flex-1 flex-col px-5 pt-3 sm:px-8 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-10">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-[#3b3b40] px-4 py-1.5 text-[13px]">
            투표 진행 중
          </span>
          <span className="text-xl font-semibold text-[#adadb8]">
            {test.shortDeadline}
          </span>
        </div>

        <div className="relative mt-7 h-10 overflow-hidden rounded-xl bg-[#1c1c1e]">
          <div
            className="absolute inset-y-0 left-0 rounded-xl bg-[#0091ff]"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold">
            {progress}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MetricCard label="노출 수" value={test.impressions} />
          <MetricCard label="투표 수" value={`${test.votes}명`} />
          <MetricCard label="상세 보기 수" value={test.detailViews} />
        </div>

        <div className="mt-12 md:max-w-none">
          <p className="text-[15px] font-semibold">테스트 포스터</p>
          <div className="mt-3 grid grid-cols-2 gap-5">
            <PosterPlaceholder
              label="포스터 A"
              imageSrc={posterAssets.a}
              className="md:h-[280px]"
            />
            <PosterPlaceholder
              label="포스터 B"
              variant="b"
              imageSrc={posterAssets.b}
              className="md:h-[280px]"
            />
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-8 pb-5">
          <Link
            href={`/owner/tests/${test.id}/results`}
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#0a85ff] text-[15px] font-semibold transition-colors hover:bg-[#0a85ff]/90"
          >
            결과 미리보기
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={`/owner/tests/${test.id}/edit`}
            className="flex h-10 items-center justify-center gap-2 text-sm font-semibold text-[#adadb8] hover:text-white"
          >
            <PencilIcon className="size-4" aria-hidden="true" />
            테스트 수정
          </Link>
        </div>
      </section>
    </OwnerShell>
  )
}
