import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import {
  MetricCard,
  OwnerShell,
  ProgressBar,
  SecondaryLink,
} from "../_components/owner-ui"
import { activeTest } from "../_components/mock-data"

export default function OwnerDashboardPage() {
  const progress = Math.round((activeTest.votes / activeTest.targetVotes) * 100)

  return (
    <OwnerShell activeTab="dashboard">
      <section className="flex min-h-[700px] flex-1 flex-col px-5 pt-6">
        <p className="text-xl font-black tracking-tight">THE PICK</p>
        <h1 className="mt-6 text-[28px] leading-tight font-semibold">
          진행 중
        </h1>
        <p className="mt-2 text-sm text-[#adadb8]">
          고객 반응을 수집하고 있는 테스트예요.
        </p>

        <article className="mt-9 rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-[#0a85ff] px-2.5 py-1 text-[11px] font-semibold">
              진행 중
            </span>
            <SecondaryLink href={`/owner/tests/${activeTest.id}`}>
              진행 현황 보기
            </SecondaryLink>
          </div>
          <h2 className="mt-5 text-lg font-semibold">{activeTest.title}</h2>
          <p className="mt-1 text-xs text-[#adadb8]">
            {activeTest.description}
          </p>
          <p className="mt-12 text-[25px] font-semibold">
            {activeTest.votes} / {activeTest.targetVotes}명 참여
          </p>
          <p className="mt-1 text-[13px] text-[#adadb8]">
            {activeTest.deadline}
          </p>
          <div className="mt-3">
            <ProgressBar value={progress} />
          </div>
          <div className="mt-12 grid grid-cols-3 gap-2">
            <MetricCard label="노출 수" value={activeTest.impressions} />
            <MetricCard label="투표 수" value={`${activeTest.votes}명`} />
            <MetricCard label="상세 보기" value={activeTest.detailViews} />
          </div>
        </article>

        <Link
          href="/owner/tests/new"
          className="mt-auto mb-5 flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#0a85ff] text-[17px] font-semibold transition-colors hover:bg-[#0a85ff]/90"
        >
          A/B 테스트 추가하기
          <ArrowRightIcon className="size-5" aria-hidden="true" />
        </Link>
      </section>
    </OwnerShell>
  )
}
