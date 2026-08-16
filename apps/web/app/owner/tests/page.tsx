import { ArrowRightIcon, CheckCircle2Icon, PlusIcon } from "lucide-react"
import Link from "next/link"

import { OwnerShell, PosterPlaceholder } from "../_components/owner-ui"
import { activeTest, completedTest } from "../_components/mock-data"

export default function OwnerTestsPage() {
  return (
    <OwnerShell activeTab="tests">
      <section className="flex flex-1 flex-col px-5 pt-7 sm:px-8 md:mx-auto md:w-full md:max-w-[1180px] md:px-10 md:pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[#adadb8]">사장님 운영 공간</p>
            <h1 className="mt-2 text-[26px] font-semibold">내 테스트</h1>
          </div>
          <Link
            href="/owner/tests/new"
            aria-label="새 테스트 만들기"
            className="inline-flex size-10 items-center justify-center rounded-full bg-[#0a85ff] transition-colors hover:bg-[#0a85ff]/90"
          >
            <PlusIcon className="size-5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 pb-8 md:grid-cols-2 md:gap-5">
          <Link
            href={`/owner/tests/${activeTest.id}`}
            className="block rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4 transition-colors hover:border-[#0a85ff] md:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#0a85ff] px-2.5 py-1 text-[11px] font-semibold">
                진행 중
              </span>
              <ArrowRightIcon
                className="size-4 text-[#adadb8]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 text-base font-semibold">{activeTest.title}</p>
            <p className="mt-1 text-xs text-[#adadb8]">
              {activeTest.votes} / {activeTest.targetVotes}명 참여
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PosterPlaceholder label="포스터 A" />
              <PosterPlaceholder label="포스터 B" variant="b" />
            </div>
          </Link>

          <Link
            href={`/owner/tests/${completedTest.id}/results`}
            className="block rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4 transition-colors hover:border-[#0a85ff] md:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#adadb8]">
                <CheckCircle2Icon className="size-4" aria-hidden="true" />
                완료 리포트
              </span>
              <ArrowRightIcon
                className="size-4 text-[#adadb8]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 text-base font-semibold">
              {completedTest.title}
            </p>
            <p className="mt-1 text-xs text-[#adadb8]">{completedTest.date}</p>
            <div className="mt-4 flex items-center gap-3">
              <PosterPlaceholder label="A안" compact />
              <div>
                <p className="text-sm text-[#adadb8]">고객이 선택한 포스터</p>
                <p className="mt-1 text-lg font-semibold">
                  {completedTest.winner} {completedTest.winnerRate}%
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </OwnerShell>
  )
}
