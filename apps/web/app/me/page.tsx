import {
  ArrowRightIcon,
  MapPinIcon,
  UserRoundIcon,
  VoteIcon,
} from "lucide-react"
import Link from "next/link"

import { PosterPlaceholder } from "../owner/_components/owner-ui"

export default function CustomerHomePage() {
  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto min-h-svh w-full max-w-[390px] bg-black md:max-w-none md:bg-[#101014]">
        <div className="mx-auto flex min-h-svh w-full flex-col px-5 py-7 sm:px-8 md:max-w-none md:px-[clamp(40px,5vw,96px)] md:py-12">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-black tracking-tight">THE PICK</p>
              <p className="mt-2 text-xs text-[#adadb8]">손님 홈</p>
            </div>
            <button
              type="button"
              aria-label="내 프로필"
              className="inline-flex size-10 items-center justify-center rounded-full border border-[#3d3d42] bg-[#1c1c1f] text-[#adadb8]"
            >
              <UserRoundIcon className="size-5" aria-hidden="true" />
            </button>
          </header>

          <section className="flex flex-1 flex-col pt-14 md:pt-20">
            <div className="flex items-center gap-2 text-sm text-[#adadb8]">
              <MapPinIcon
                className="size-4 text-[#0a85ff]"
                aria-hidden="true"
              />
              서울 성동구 성수동
            </div>
            <h1 className="mt-4 text-[30px] leading-tight font-semibold tracking-tight md:text-5xl">
              내 주변 가게의
              <br />
              포스터를 골라보세요.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#adadb8] md:text-base">
              짧은 투표로 사장님의 더 좋은 홍보물을 만들고 포인트를 받아요.
            </p>

            <article className="mt-10 max-w-3xl rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1a334f] px-3 py-1 text-xs font-semibold text-[#80c4ff]">
                  <VoteIcon className="size-3.5" aria-hidden="true" />
                  투표 1회
                </span>
                <span className="text-sm font-semibold text-[#80c4ff]">
                  +30P
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold">
                성수동 신메뉴 포스터
              </h2>
              <p className="mt-1 text-xs text-[#adadb8]">
                어떤 포스터가 더 방문하고 싶게 만드나요?
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 md:max-w-xl md:gap-5">
                <PosterPlaceholder label="포스터 A" />
                <PosterPlaceholder label="포스터 B" variant="b" />
              </div>
              <Link
                href="/me"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#0a85ff] text-[15px] font-semibold transition-colors hover:bg-[#0a85ff]/90"
              >
                투표 둘러보기
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </article>
          </section>
        </div>
      </div>
    </main>
  )
}
