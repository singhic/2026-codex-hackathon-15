"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@workspace/ui/components/button"

import { RegionSelect } from "@/components/region-select"
import {
  ApiError,
  apiFetch,
  type AgeBand,
  type Catalog,
  type LegalDocument,
  type MyProfile,
} from "@/lib/api/client"

const ageBands: Array<{ value: AgeBand; label: string }> = [
  { value: "teens", label: "10대" },
  { value: "twenties", label: "20대" },
  { value: "thirties", label: "30대" },
  { value: "forties", label: "40대" },
  { value: "fifties", label: "50대" },
  { value: "sixties_plus", label: "60대 이상" },
]

const inputClass =
  "h-12 w-full rounded-[14px] border border-[#3d3d42] bg-[#26262b] px-4 text-[15px] text-white outline-none placeholder:text-[#adadb8] focus:border-[#0a85ff] focus:ring-1 focus:ring-[#0a85ff]"

export function OnboardingClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "owner" ? "owner" : "guest"
  const returnTo = getSafeReturnPath(
    searchParams.get("next") ?? searchParams.get("returnTo")
  )
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [regionCode, setRegionCode] = useState("")
  const [ageBand, setAgeBand] = useState<AgeBand | "">("")
  const [interests, setInterests] = useState<number[]>([])
  const [checkedDocuments, setCheckedDocuments] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [nextProfile, nextDocuments, nextCatalog] = await Promise.all([
        apiFetch<MyProfile>("/api/me/profile"),
        apiFetch<LegalDocument[]>("/api/me/consents"),
        apiFetch<Catalog>("/api/catalog"),
      ])

      setProfile(nextProfile)
      setDocuments(nextDocuments)
      setCatalog(nextCatalog)
      setDisplayName(nextProfile.displayName)
      setRegionCode(nextProfile.regionCode ?? "")
      setAgeBand(nextProfile.ageBand ?? "")
      setInterests(nextProfile.interestCategoryIds)
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      setErrorMessage("온보딩 정보를 불러오지 못했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const requiredDocuments = useMemo(
    () => documents.filter((document) => document.required),
    [documents]
  )
  const requiredChecked = requiredDocuments.every((document) =>
    checkedDocuments.includes(document.id)
  )

  function toggleInterest(categoryId: number) {
    setInterests((current) =>
      current.includes(categoryId)
        ? current.filter((value) => value !== categoryId)
        : [...current, categoryId]
    )
  }

  function toggleDocument(documentId: string) {
    setCheckedDocuments((current) =>
      current.includes(documentId)
        ? current.filter((value) => value !== documentId)
        : [...current, documentId]
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requiredChecked) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const consentResult = await apiFetch<{ requiredAccepted: boolean }>(
        "/api/me/consents",
        {
          method: "POST",
          body: JSON.stringify({ documentIds: checkedDocuments }),
        }
      )

      if (!consentResult.requiredAccepted) {
        setErrorMessage("필수 약관을 모두 선택해 주세요.")
        return
      }

      const updatedProfile = await apiFetch<MyProfile>("/api/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName,
          regionCode: regionCode || null,
          ageBand: ageBand || null,
          interestCategoryIds: interests,
        }),
      })
      setProfile(updatedProfile)

      router.push(returnTo ?? (role === "owner" ? "/owner/onboarding" : "/me"))
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      setErrorMessage(
        "저장하지 못했습니다. 입력값을 확인하고 다시 시도해 주세요."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <OnboardingShell>불러오는 중...</OnboardingShell>
  }

  if (!profile || !catalog) {
    return (
      <OnboardingShell>
        <div className="space-y-4 text-center">
          <p>{errorMessage ?? "온보딩 정보를 준비하지 못했습니다."}</p>
          <Button
            type="button"
            className="rounded-xl bg-[#0a85ff]"
            onClick={() => void loadData()}
          >
            다시 시도
          </Button>
        </div>
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell>
      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <p className="text-sm font-semibold text-[#80c4ff]">
            {role === "owner" ? "사장님 시작하기" : "손님 시작하기"}
          </p>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">
            서비스 이용을 위한
            <br />
            기본 정보를 입력해 주세요.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#adadb8]">
            약관에 동의하고 관심 지역을 설정하면 맞춤 화면을 보여드려요.
          </p>
        </div>

        <label
          className="block space-y-2 text-sm font-semibold"
          htmlFor="display-name"
        >
          표시 이름
          <input
            id="display-name"
            className={inputClass}
            value={displayName}
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="예: 포스트픽 사용자"
            required
          />
        </label>

        <label
          className="block space-y-2 text-sm font-semibold"
          htmlFor="region-code"
        >
          활동 지역
          <RegionSelect
            id="region-code"
            value={regionCode}
            onChange={setRegionCode}
          />
        </label>

        <fieldset>
          <legend className="text-sm font-semibold">연령대</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ageBands.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`h-10 rounded-xl border text-xs font-semibold transition-colors ${
                  ageBand === item.value
                    ? "border-[#0a85ff] bg-[#0a85ff] text-white"
                    : "border-[#3d3d42] bg-[#26262b] text-[#adadb8]"
                }`}
                aria-pressed={ageBand === item.value}
                onClick={() => setAgeBand(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold">관심 업종</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {catalog.categories.map((category) => {
              const selected = interests.includes(category.id)
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`h-10 rounded-xl border text-xs font-semibold transition-colors ${
                    selected
                      ? "border-[#0a85ff] bg-[#0a85ff] text-white"
                      : "border-[#3d3d42] bg-[#26262b] text-[#adadb8]"
                  }`}
                  aria-pressed={selected}
                  onClick={() => toggleInterest(category.id)}
                >
                  {category.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold">약관 동의</legend>
          <div className="mt-3 space-y-1">
            {documents.map((document) => {
              const checked = checkedDocuments.includes(document.id)
              return (
                <button
                  key={document.id}
                  type="button"
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-[#26262b]"
                  onClick={() => toggleDocument(document.id)}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-md border ${
                      checked
                        ? "border-[#0a85ff] bg-[#0a85ff]"
                        : "border-[#3d3d42] bg-[#26262b]"
                    }`}
                  >
                    {checked ? (
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="flex-1 text-sm">
                    {document.required ? "[필수]" : "[선택]"} {document.title}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {errorMessage ? (
          <p
            className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSaving || !requiredChecked}
          className="h-14 w-full rounded-2xl bg-[#0a85ff] text-[17px] font-semibold hover:bg-[#0a85ff]/90"
        >
          {isSaving ? "저장 중..." : "동의하고 계속하기"}
          {!isSaving ? <ArrowRightIcon aria-hidden="true" /> : null}
        </Button>
      </form>
    </OnboardingShell>
  )
}

function getSafeReturnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    !["/owner", "/vote", "/me", "/onboarding"].some(
      (prefix) => value === prefix || value.startsWith(`${prefix}/`)
    )
  ) {
    return null
  }

  return value
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto min-h-svh w-full max-w-[620px] bg-black px-5 py-7 sm:px-8 md:my-10 md:min-h-0 md:rounded-[18px] md:px-10 md:py-10">
        <header className="flex items-center gap-2">
          <button
            type="button"
            aria-label="로그인으로 돌아가기"
            className="inline-flex size-7 items-center justify-center text-white"
            onClick={() => window.history.back()}
          >
            <ChevronLeftIcon className="size-6" aria-hidden="true" />
          </button>
          <p className="text-xl font-semibold tracking-tight">더픽</p>
        </header>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  )
}
