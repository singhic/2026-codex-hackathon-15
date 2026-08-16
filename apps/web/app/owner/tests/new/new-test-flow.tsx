"use client"

import { useMemo, useRef, useState } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ImagePlusIcon,
  InfoIcon,
  UploadIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"

import { activeTest, votePackages } from "../../_components/mock-data"
import { OwnerShell } from "../../_components/owner-ui"

type NewTestFlowProps = {
  mode?: "new" | "edit"
}

type FlowStep = 1 | 2 | 3

const fieldClass =
  "h-11 w-full rounded-xl border border-[#3b3b40] bg-[#1c1c1e] px-3.5 text-[13px] text-white outline-none placeholder:text-[#adadb8] focus:border-[#0a85ff] focus:ring-1 focus:ring-[#0a85ff]"

const defaultVotePackage = votePackages.at(-1)!

function FlowButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit"
}) {
  return (
    <Button
      type={type}
      size="lg"
      className="h-12 w-full rounded-[14px] bg-[#0091ff] text-[15px] font-semibold text-white hover:bg-[#0091ff]/90"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function PosterUploadCard({
  label,
  fileName,
  inputId,
  onChange,
}: {
  label: string
  fileName: string
  inputId: string
  onChange: (fileName: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        className="group relative flex h-[230px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-[#3b3b40] bg-[#29292e] text-sm text-[#adadb8] transition-colors hover:border-[#0a85ff] md:h-[300px]"
        onClick={() => inputRef.current?.click()}
      >
        {fileName ? (
          <>
            <ImagePlusIcon
              className="size-7 text-[#0091ff]"
              aria-hidden="true"
            />
            <span className="mt-3 max-w-[130px] truncate text-xs text-white">
              {fileName}
            </span>
          </>
        ) : (
          <>
            <UploadIcon className="size-6" aria-hidden="true" />
            <span className="mt-3">포스터 {label}</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChange(file.name)
        }}
      />
      <button
        type="button"
        className="mt-2 h-7 w-full rounded-xl border border-[#3b3b40] bg-[#1c1c1e] text-xs font-semibold text-[#adadb8] transition-colors hover:border-[#0a85ff]"
        onClick={() => inputRef.current?.click()}
      >
        이미지 업로드
      </button>
    </div>
  )
}

function PosterStep({
  title,
  fileNames,
  question,
  onTitleChange,
  onQuestionChange,
  onFileChange,
  onNext,
}: {
  title: string
  fileNames: [string, string]
  question: string
  onTitleChange: (value: string) => void
  onQuestionChange: (value: string) => void
  onFileChange: (index: 0 | 1, value: string) => void
  onNext: () => void
}) {
  return (
    <form
      className="flex min-h-[calc(100svh-56px)] flex-1 flex-col px-5 pt-5 sm:px-8 md:mx-auto md:w-full md:max-w-3xl md:px-8 md:pt-10"
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
    >
      <label htmlFor="test-title" className="text-[13px] text-[#adadb8]">
        테스트 제목
      </label>
      <input
        id="test-title"
        className={`${fieldClass} mt-2`}
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        required
      />

      <p className="mt-5 text-[13px] text-[#adadb8]">포스터 A/B</p>
      <div className="mt-3 flex gap-5">
        <PosterUploadCard
          label="A"
          fileName={fileNames[0]}
          inputId="poster-a"
          onChange={(value) => onFileChange(0, value)}
        />
        <PosterUploadCard
          label="B"
          fileName={fileNames[1]}
          inputId="poster-b"
          onChange={(value) => onFileChange(1, value)}
        />
      </div>

      <label
        htmlFor="test-question"
        className="mt-7 text-[13px] text-[#adadb8]"
      >
        고객에게 보여줄 질문
      </label>
      <textarea
        id="test-question"
        className="mt-2 min-h-[74px] w-full resize-none rounded-xl border border-[#3b3b40] bg-[#1c1c1e] px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-[#adadb8] focus:border-[#0a85ff] focus:ring-1 focus:ring-[#0a85ff]"
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        required
      />

      <div className="mt-auto pt-8 pb-5">
        <FlowButton type="submit">
          다음
          <ArrowRightIcon aria-hidden="true" />
        </FlowButton>
      </div>
    </form>
  )
}

function ConditionStep({
  selectedVotes,
  onSelectVotes,
  onNext,
}: {
  selectedVotes: number
  onSelectVotes: (votes: number) => void
  onNext: () => void
}) {
  const selectedPackage =
    votePackages.find((item) => item.votes === selectedVotes) ??
    defaultVotePackage
  const totalPrice = selectedPackage.price * activeTest.days

  return (
    <section className="flex min-h-[calc(100svh-56px)] flex-1 flex-col px-5 pt-5 sm:px-8 md:mx-auto md:w-full md:max-w-3xl md:px-8 md:pt-10">
      <h1 className="text-xl font-semibold">하루 최소 보장 투표 수</h1>
      <p className="mt-1 text-[13px] text-[#adadb8]">
        설정한 하루 최소 인원만큼 투표를 보장해 드려요.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {votePackages.map((item) => {
          const selected = item.votes === selectedVotes

          return (
            <button
              key={item.votes}
              type="button"
              className={`relative h-[62px] rounded-[14px] border px-3.5 text-left transition-colors ${
                selected
                  ? "border-[#0a85ff] bg-[#0a85ff]"
                  : "border-[#3d3d42] bg-[#1c1c1f] hover:border-[#0a85ff]"
              }`}
              aria-pressed={selected}
              onClick={() => onSelectVotes(item.votes)}
            >
              {selected ? (
                <CheckIcon
                  className="absolute top-2 right-2 size-4"
                  aria-hidden="true"
                />
              ) : null}
              <span className="block text-[17px] font-semibold">
                {item.votes}명
              </span>
              <span className="mt-0.5 block text-xs text-white/80">
                {item.price.toLocaleString("ko-KR")}원
              </span>
            </button>
          )
        })}
      </div>

      <h2 className="mt-6 text-[17px] font-semibold">테스트 운영 기간</h2>
      <button
        type="button"
        className="mt-2 flex h-12 w-full items-center justify-between rounded-xl bg-[#26262b] px-4 text-left text-[15px]"
      >
        8월 20일&nbsp; ~ &nbsp;8월 22일
        <ChevronDownIcon className="size-4 text-[#adadb8]" aria-hidden="true" />
      </button>
      <p className="mt-2 text-xs text-[#adadb8]">
        매일 최소 보장 투표 수를 기준으로 운영됩니다.
      </p>

      <div className="mt-5 rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] p-4">
        <div className="flex items-center justify-between text-[15px] font-semibold">
          <span>예상 사용 금액</span>
          <span>총 {totalPrice.toLocaleString("ko-KR")}원</span>
        </div>
        <div className="mt-2 space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#adadb8]">하루 최소 보장</span>
            <span>{selectedVotes}명</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#adadb8]">하루 사용 금액</span>
            <span>{selectedPackage.price.toLocaleString("ko-KR")}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#adadb8]">운영 기간</span>
            <span>{activeTest.days}일</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl bg-[#1a334f] px-3.5 py-4">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2e7adb] text-sm font-semibold">
          <InfoIcon className="size-3.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold">
            최소 보장 인원 미달 시 비례 환급
          </p>
          <p className="mt-2 text-xs leading-5 text-[#adadb8]">
            하루 기준 최소 보장 투표 수를 채우지 못하면,
            <br />
            부족한 인원만큼 사용 금액을 비례 환급해 드립니다.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8 pb-5">
        <FlowButton onClick={onNext}>
          다음
          <ArrowRightIcon aria-hidden="true" />
        </FlowButton>
      </div>
    </section>
  )
}

function ConfirmStep({
  selectedVotes,
  onConfirm,
  onCancel,
}: {
  selectedVotes: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const selectedPackage =
    votePackages.find((item) => item.votes === selectedVotes) ??
    defaultVotePackage
  const totalPrice = selectedPackage.price * activeTest.days

  return (
    <div className="relative min-h-[calc(100svh-56px)] flex-1 px-5 pt-8">
      <h1 className="text-xl font-semibold">투표 조건 설정</h1>
      <div className="mt-5 h-[52px] rounded-[14px] bg-[#26262b]" />
      <div className="mt-4 h-[52px] rounded-[14px] bg-[#26262b]" />
      <div className="mt-4 h-[118px] rounded-[14px] bg-[#26262b]" />

      <div className="fixed inset-0 z-20 bg-black/60" aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto min-h-[562px] w-full max-w-[390px] rounded-t-[22px] bg-[#1c1c1f] px-5 pt-3 md:max-w-[560px] md:px-8"
      >
        <div className="mx-auto h-1.5 w-[70px] rounded-full bg-[#adadb8]" />
        <h2 id="confirm-title" className="mt-7 text-[22px] font-semibold">
          테스트를 시작할까요?
        </h2>
        <div className="mt-8 space-y-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[#adadb8]">하루 최소 보장 투표 수</span>
            <span className="font-semibold">{selectedVotes}명</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#adadb8]">운영 기간</span>
            <span className="font-semibold">8월 20일 ~ 8월 22일 / 3일</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#adadb8]">하루 사용 금액</span>
            <span className="font-semibold">
              {selectedPackage.price.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
        <div className="mt-7 border-t border-[#3d3d42] pt-5">
          <div className="flex items-center justify-between font-semibold">
            <span>총 사용 금액</span>
            <span className="text-xl">
              {totalPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-5 space-y-5">
          <FlowButton onClick={onConfirm}>
            시작하기
            <ArrowRightIcon aria-hidden="true" />
          </FlowButton>
          <button
            type="button"
            className="block w-full text-center text-base font-semibold text-[#adadb8] transition-colors hover:text-white"
            onClick={onCancel}
          >
            취소
          </button>
        </div>
      </section>
    </div>
  )
}

export function NewTestFlow({ mode = "new" }: NewTestFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<FlowStep>(1)
  const [title, setTitle] = useState(
    mode === "edit" ? activeTest.title : "신메뉴 딸기 라떼 홍보 포스터"
  )
  const [question, setQuestion] = useState(activeTest.question)
  const [fileNames, setFileNames] = useState<[string, string]>(["", ""])
  const [selectedVotes, setSelectedVotes] = useState(activeTest.dailyVotes)

  const headerTitle = mode === "edit" ? "테스트 수정" : "새 A/B 테스트 만들기"
  const fileUploadState = useMemo(
    () => fileNames.filter(Boolean).length,
    [fileNames]
  )

  return (
    <OwnerShell
      showTabs={false}
      backHref={
        mode === "edit" ? `/owner/tests/${activeTest.id}` : "/owner/tests"
      }
      headerTitle={headerTitle}
    >
      {step === 1 ? (
        <PosterStep
          title={title}
          fileNames={fileNames}
          question={question}
          onTitleChange={setTitle}
          onQuestionChange={setQuestion}
          onFileChange={(index, value) => {
            setFileNames((current) => {
              const next: [string, string] = [...current]
              next[index] = value
              return next
            })
          }}
          onNext={() => setStep(2)}
        />
      ) : null}
      {step === 2 ? (
        <ConditionStep
          selectedVotes={selectedVotes}
          onSelectVotes={setSelectedVotes}
          onNext={() => setStep(3)}
        />
      ) : null}
      {step === 3 ? (
        <ConfirmStep
          selectedVotes={selectedVotes}
          onCancel={() => setStep(2)}
          onConfirm={() => router.push(`/owner/tests/${activeTest.id}`)}
        />
      ) : null}
      {fileUploadState > 0 ? (
        <span className="sr-only">{fileUploadState}개의 포스터가 등록됨</span>
      ) : null}
    </OwnerShell>
  )
}
