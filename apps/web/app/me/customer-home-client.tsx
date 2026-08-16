"use client"

import { useCallback, useEffect, useState } from "react"
import { MapPinIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"

import { RegionSelect } from "@/components/region-select"
import {
  ApiError,
  apiFetch,
  getApiErrorMessage,
  type AgeBand,
  type Catalog,
  type MyProfile,
  type RewardWallet,
} from "@/lib/api/client"
import { getRegionLabel } from "@/lib/regions"

const ageBands: Array<{ value: AgeBand; label: string }> = [
  { value: "teens", label: "10대" },
  { value: "twenties", label: "20대" },
  { value: "thirties", label: "30대" },
  { value: "forties", label: "40대" },
  { value: "fifties", label: "50대" },
  { value: "sixties_plus", label: "60대 이상" },
]

export function CustomerHomeClient() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [rewards, setRewards] = useState<RewardWallet | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [regionCode, setRegionCode] = useState("")
  const [ageBand, setAgeBand] = useState<AgeBand | "">("")
  const [interests, setInterests] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const [nextProfile, nextRewards, nextCatalog] = await Promise.all([
        apiFetch<MyProfile>("/api/me/profile"),
        apiFetch<RewardWallet>("/api/me/rewards"),
        apiFetch<Catalog>("/api/catalog"),
      ])
      setProfile(nextProfile)
      setRewards(nextRewards)
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
      setMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "내 정보를 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      const nextProfile = await apiFetch<MyProfile>("/api/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName,
          regionCode: regionCode || null,
          ageBand: ageBand || null,
          interestCategoryIds: interests,
        }),
      })
      setProfile(nextProfile)
      setMessage("프로필을 저장했습니다.")
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? getApiErrorMessage(error.code)
          : "프로필을 저장하지 못했습니다."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <Message>내 정보를 불러오는 중...</Message>
  }

  if (!profile || !rewards || !catalog) {
    return (
      <Message>
        <p>{message ?? "내 정보를 준비하지 못했습니다."}</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-[#0a85ff] px-5 py-3 text-sm font-semibold"
          onClick={() => void loadData()}
        >
          다시 시도
        </button>
      </Message>
    )
  }

  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto min-h-svh w-full max-w-[620px] bg-black px-5 py-7 sm:px-8 md:my-10 md:min-h-0 md:rounded-[18px] md:px-10 md:py-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black tracking-tight">THE PICK</p>
            <p className="mt-2 text-xs text-[#adadb8]">손님 홈</p>
          </div>
          <Link
            href="/me/account"
            aria-label="내 계정"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#3d3d42] bg-[#1c1c1f] text-[#adadb8]"
          >
            <UserRoundIcon className="size-5" aria-hidden="true" />
          </Link>
        </header>

        <section className="pt-14 md:pt-20">
          <div className="flex items-center gap-2 text-sm text-[#adadb8]">
            <MapPinIcon className="size-4 text-[#0a85ff]" aria-hidden="true" />
            {getRegionLabel(profile.regionCode) || "활동 지역을 설정해 주세요"}
          </div>
          <h1 className="mt-4 text-[30px] leading-tight font-semibold tracking-tight md:text-5xl">
            내 주변 가게의
            <br />
            포스터를 골라보세요.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#adadb8] md:text-base">
            짧은 투표로 사장님의 더 좋은 홍보물을 만들고 포인트를 받아요.
          </p>

          <div className="mt-10 rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-5">
            <p className="text-sm text-[#adadb8]">내 포인트</p>
            <p className="mt-2 text-3xl font-semibold">{rewards.balance}P</p>
            <p className="mt-2 text-xs text-[#adadb8]">
              투표 완료 후 지급된 포인트가 여기에 표시됩니다.
            </p>
          </div>

          <form
            onSubmit={saveProfile}
            className="mt-6 rounded-[18px] border border-[#3d3d42] bg-[#1c1c1f] p-5"
          >
            <h2 className="text-lg font-semibold">내 정보</h2>
            <label
              className="mt-5 block space-y-2 text-sm font-semibold"
              htmlFor="me-display-name"
            >
              표시 이름
              <input
                id="me-display-name"
                className="h-11 w-full rounded-xl border border-[#3d3d42] bg-[#26262b] px-3 text-sm outline-none focus:border-[#0a85ff]"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                required
              />
            </label>
            <label
              className="mt-4 block space-y-2 text-sm font-semibold"
              htmlFor="me-region-code"
            >
              활동 지역
              <RegionSelect
                id="me-region-code"
                value={regionCode}
                onChange={setRegionCode}
              />
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">연령대</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ageBands.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`h-9 rounded-lg border text-xs font-semibold ${
                      ageBand === item.value
                        ? "border-[#0a85ff] bg-[#0a85ff]"
                        : "border-[#3d3d42] bg-[#26262b] text-[#adadb8]"
                    }`}
                    onClick={() => setAgeBand(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">관심 업종</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {catalog.categories.map((category) => {
                  const selected = interests.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`h-9 rounded-lg border text-xs font-semibold ${
                        selected
                          ? "border-[#0a85ff] bg-[#0a85ff]"
                          : "border-[#3d3d42] bg-[#26262b] text-[#adadb8]"
                      }`}
                      onClick={() =>
                        setInterests((current) =>
                          selected
                            ? current.filter((id) => id !== category.id)
                            : [...current, category.id]
                        )
                      }
                    >
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </fieldset>
            {message ? (
              <p className="mt-4 text-sm text-[#80c4ff]" role="status">
                {message}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={isSaving}
              className="mt-5 h-11 w-full rounded-xl bg-[#0a85ff]"
            >
              {isSaving ? "저장 중..." : "프로필 저장"}
            </Button>
          </form>

          <p className="mt-6 rounded-xl border border-dashed border-[#3d3d42] px-4 py-4 text-center text-sm text-[#adadb8]">
            매장 공유 링크를 통해 투표에 참여할 수 있어요.
          </p>
        </section>
      </div>
    </main>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black px-6 text-center text-sm text-[#adadb8]">
      <div>{children}</div>
    </main>
  )
}
