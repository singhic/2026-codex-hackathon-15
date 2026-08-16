"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CheckIcon,
  StoreIcon,
  VoteIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { RegionSelect } from "@/components/region-select"
import {
  ApiError,
  apiFetch,
  type Catalog,
  type StoreSummary,
} from "@/lib/api/client"

const steps = ["서비스 안내", "매장 정보", "설정 완료"]

const features: Array<{
  icon: LucideIcon
  title: string
  description: string
}> = [
  {
    icon: StoreIcon,
    title: "포스터 등록",
    description: "두 가지 홍보 시안을 등록합니다.",
  },
  {
    icon: VoteIcon,
    title: "고객 투표",
    description: "공유 링크로 선택을 수집합니다.",
  },
  {
    icon: BarChart3Icon,
    title: "결과 확인",
    description: "선택 비율을 한눈에 비교합니다.",
  },
]

export function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [regionCode, setRegionCode] = useState("")
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void apiFetch<Catalog>("/api/catalog")
      .then(setCatalog)
      .catch(() => setErrorMessage("업종 목록을 불러오지 못했습니다."))
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const categoryId = Number(formData.get("categoryId"))
    const address = String(formData.get("address") ?? "").trim()

    setIsSaving(true)
    setErrorMessage(null)

    try {
      await apiFetch<StoreSummary>("/api/owner/stores", {
        method: "POST",
        body: JSON.stringify({ name, categoryId, regionCode, address }),
      })
      setStep(3)
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONSENT_REQUIRED") {
        setErrorMessage(
          "필수 약관 동의가 필요합니다. 온보딩 약관으로 이동해 주세요."
        )
      } else if (
        error instanceof ApiError &&
        error.code === "UNAUTHENTICATED"
      ) {
        setErrorMessage("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.")
      } else {
        setErrorMessage(
          "매장 정보를 저장하지 못했습니다. 입력값을 확인해 주세요."
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-5 text-white">
      <ol className="grid grid-cols-3 gap-2" aria-label="온보딩 진행 단계">
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const isCurrent = stepNumber === step
          const isComplete = stepNumber < step

          return (
            <li key={label} className="space-y-2">
              <div
                className={`h-1.5 rounded-full ${
                  stepNumber <= step ? "bg-[#0a85ff]" : "bg-[#26262b]"
                }`}
              />
              <p
                className={`text-xs ${
                  isCurrent || isComplete
                    ? "font-medium text-white"
                    : "text-[#adadb8]"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {stepNumber}. {label}
              </p>
            </li>
          )
        })}
      </ol>

      {step === 1 ? (
        <Card className="border-[#3d3d42] bg-[#1c1c1f] text-white">
          <CardHeader className="gap-2 border-b border-[#3d3d42] pb-5">
            <CardTitle className="text-xl sm:text-2xl">
              고객의 선택으로 포스터를 검증하세요
            </CardTitle>
            <CardDescription className="leading-6 text-[#adadb8]">
              두 포스터를 등록하고 투표 링크를 공유하면 더 좋은 홍보물을 빠르게
              확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-1">
            <ul className="grid gap-3 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="rounded-xl border border-[#3d3d42] bg-[#26262b] p-4"
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <p className="mt-4 font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-[#adadb8]">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="lg"
              className="h-12 w-full rounded-[14px] bg-[#0a85ff] text-white hover:bg-[#0a85ff]/90"
              onClick={() => setStep(2)}
            >
              매장 설정 시작하기
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="border-[#3d3d42] bg-[#1c1c1f] text-white">
          <CardHeader className="gap-2 border-b border-[#3d3d42] pb-5">
            <CardTitle className="text-xl sm:text-2xl">
              매장 기본 정보를 알려주세요
            </CardTitle>
            <CardDescription className="text-[#adadb8]">
              투표 화면과 운영 대시보드에 표시될 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  매장 이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="예: 모먼트 카페"
                  autoComplete="organization"
                  className="h-11 w-full rounded-xl border border-[#3d3d42] bg-[#26262b] px-3 text-sm text-white outline-none placeholder:text-[#adadb8] focus-visible:border-[#0a85ff] focus-visible:ring-2 focus-visible:ring-[#0a85ff]/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-medium">
                  매장 업종
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  disabled={!catalog}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue={catalog?.categories[0]?.id ?? ""}
                >
                  {catalog?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#adadb8]">
                  고객이 이해하기 쉬운 업종명으로 입력해 주세요.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="regionCode" className="text-sm font-medium">
                  매장 지역
                </label>
                <RegionSelect
                  id="regionCode"
                  name="regionCode"
                  required
                  value={regionCode}
                  onChange={setRegionCode}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  매장 주소
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  maxLength={240}
                  placeholder="예: 서울 성동구 성수동"
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {errorMessage ? (
                <p
                  className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  className="h-11 border-[#3d3d42] bg-[#26262b] text-white hover:bg-[#313138] sm:w-32"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeftIcon aria-hidden="true" />
                  이전
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !catalog}
                  size="lg"
                  className="h-11 flex-1 rounded-[14px] bg-[#0a85ff] text-white hover:bg-[#0a85ff]/90"
                >
                  {isSaving ? "저장 중..." : "설정 완료하기"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="border-[#3d3d42] bg-[#1c1c1f] text-white">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#0a85ff] text-white">
              <CheckIcon className="size-7" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              매장 설정이 완료되었습니다
            </h1>
            <p className="mt-3 max-w-md leading-6 text-[#adadb8]">
              이제 첫 A/B 테스트를 만들고 고객의 선택을 확인할 수 있습니다.
            </p>
            <Button
              size="lg"
              className="mt-8 h-12 w-full rounded-[14px] bg-[#0a85ff] text-white hover:bg-[#0a85ff]/90 sm:w-auto sm:min-w-52"
              render={<Link href="/owner/dashboard" />}
            >
              운영 대시보드로 이동
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
