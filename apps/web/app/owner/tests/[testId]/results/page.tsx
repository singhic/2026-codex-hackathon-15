import { DownloadIcon } from "lucide-react"

import { completedTest } from "../../../_components/mock-data"
import {
  MetricCard,
  OwnerShell,
  PosterPlaceholder,
} from "../../../_components/owner-ui"

type ResultsPageProps = {
  params: Promise<{ testId: string }>
}

export default async function OwnerResultsPage({ params }: ResultsPageProps) {
  await params

  return (
    <OwnerShell activeTab="tests">
      <section className="flex flex-1 flex-col px-5 pt-7 sm:px-8 md:mx-auto md:w-full md:max-w-[1180px] md:px-10 md:pt-12">
        <h1 className="text-[26px] font-semibold">완료 리포트</h1>
        <p className="mt-1 text-sm text-[#adadb8]">
          고객이 선택한 포스터 결과를 확인하세요.
        </p>

        <article className="relative mt-8 h-[364px] max-w-4xl rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4 md:h-[390px] md:p-6">
          <p className="text-[13px] font-semibold text-[#adadb8]">
            고객이 더 선택한 포스터
          </p>
          <span className="absolute top-[55px] left-[56px] z-10 rounded-full bg-[#0a85ff] px-4 py-1 text-[11px] font-semibold">
            A안 선택
          </span>
          <div className="mt-16 w-[196px] md:ml-2">
            <PosterPlaceholder label="포스터 A" className="md:h-[220px]" />
            <p className="mt-2 text-center text-[28px] font-semibold">68%</p>
          </div>
          <div className="absolute top-[197px] right-4 w-[84px] md:right-8">
            <p className="mb-2 text-center text-xs text-[#adadb8]">B안</p>
            <PosterPlaceholder label="B안" variant="b" compact />
            <p className="mt-2 text-center text-[11px] text-[#adadb8]">32%</p>
          </div>
          <div className="absolute right-3 bottom-4 left-3 rounded bg-[#0a85ff] px-2.5 py-2 text-center text-xs">
            100명 중 68명이 A안을 더 방문하고 싶은 포스터로 선택했어요.
          </div>
        </article>

        <h2 className="mt-7 text-base font-semibold">성과 요약</h2>
        <div className="mt-3 grid max-w-4xl grid-cols-3 gap-3">
          <MetricCard label="노출 수" value="1,240회" />
          <MetricCard label="투표 수" value={`${completedTest.votes}명`} />
          <MetricCard label="상세 보기" value="86회" />
        </div>

        <button
          type="button"
          className="mt-5 flex h-12 max-w-4xl items-center justify-center gap-2 rounded-[14px] bg-[#26262b] text-[15px] font-semibold transition-colors hover:bg-[#313138]"
        >
          <DownloadIcon className="size-4" aria-hidden="true" />
          선택된 포스터 다운로드
        </button>
      </section>
    </OwnerShell>
  )
}
