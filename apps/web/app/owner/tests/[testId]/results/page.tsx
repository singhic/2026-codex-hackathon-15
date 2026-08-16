import { DownloadIcon } from "lucide-react"

import { completedTest, posterAssets } from "../../../_components/mock-data"
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
      <section className="flex flex-1 flex-col px-5 pt-7 sm:px-8 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-12">
        <h1 className="text-[26px] font-semibold">완료 리포트</h1>
        <p className="mt-1 text-sm text-[#adadb8]">
          고객이 선택한 포스터 결과를 확인하세요.
        </p>

        <h2 className="mt-8 text-base font-semibold">성과 요약</h2>
        <div className="mt-3 grid max-w-none grid-cols-3 gap-3">
          <MetricCard label="노출 수" value="1,240회" />
          <MetricCard label="투표 수" value={`${completedTest.votes}명`} />
          <MetricCard label="상세 보기" value="86회" />
        </div>

        <h2 className="mt-8 text-[24px] font-semibold">고객이 픽한 포스터</h2>
        <article className="relative mt-3 h-[322px] max-w-none rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4 md:p-6">
          <div className="absolute top-10 left-5 w-[196px] md:left-8">
            <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#0a85ff] px-4 py-1 text-[11px] font-semibold">
              A안
            </span>
            <div className="flex justify-center pt-8">
              <PosterPlaceholder
                label="포스터 A"
                imageSrc={posterAssets.resultA}
                className="h-[196px] w-[165px] opacity-20"
              />
            </div>
            <p className="mt-1 text-center text-[28px] font-semibold">68%</p>
          </div>
          <div className="absolute top-[112px] right-4 w-[84px] md:right-8">
            <p className="mb-2 text-center text-xs text-[#adadb8]">B안</p>
            <PosterPlaceholder
              label="B안"
              variant="b"
              imageSrc={posterAssets.resultB}
              compact
              className="opacity-30"
            />
            <p className="mt-2 text-center text-[11px] text-[#adadb8]">32%</p>
          </div>
        </article>

        <button
          type="button"
          className="mt-5 flex h-12 max-w-none items-center justify-center gap-2 rounded-[14px] bg-[#26262b] text-[15px] font-semibold transition-colors hover:bg-[#313138]"
        >
          <DownloadIcon className="size-4" aria-hidden="true" />
          포스터 다운로드
        </button>
      </section>
    </OwnerShell>
  )
}
