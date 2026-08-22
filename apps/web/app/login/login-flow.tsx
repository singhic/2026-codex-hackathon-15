"use client"

import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  SearchIcon,
  StoreIcon,
  UserRoundIcon,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import { GoogleLoginButton } from "./google-login-button"

type Role = "owner" | "guest"
type FlowStep = 1 | 2 | 4 | 5 | 6 | 7

type LoginFlowProps = {
  initialRole: Role | null
  initialStep: FlowStep
  error?: string
  returnTo: string
}

type OwnerInfo = {
  storeName: string
  category: string
  location: string
  businessStatus: string
}

type GuestInfo = {
  location: string
  interests: string[]
  age: string
  gender: string
}

const requiredTerms = [
  "서비스 이용약관",
  "개인정보 수집 및 이용",
  "만 14세 이상입니다",
  "테스트 등록 및 결과 제공 정책",
]

const optionalTerm = "마케팅 정보 수신 동의"
const interestOptions = ["카페", "맛집", "뷰티", "쇼핑", "운동", "문화"]
const neighborhoodOptions = [
  "서울 성동구 성수동",
  "서울 성동구 서울숲",
  "서울 광진구 건대입구",
  "서울 마포구 연남동",
  "서울 강남구 역삼동",
  "서울 용산구 한남동",
]

const baseInputClass =
  "h-12 w-full rounded-[14px] border border-[#3d3d42] bg-[#26262b] px-4 text-[15px] text-white outline-none placeholder:text-[#adadb8] focus:border-[#0a85ff] focus:ring-1 focus:ring-[#0a85ff]"

function getRoleLabel(role: Role) {
  return role === "owner" ? "사장님으로 시작" : "손님으로 시작"
}

function getAuthTarget(role: Role, returnTo: string) {
  const params = new URLSearchParams({ role })

  if (returnTo !== "/") {
    params.set("returnTo", returnTo)
  }

  return `/onboarding?${params.toString()}`
}

function PageShell({
  children,
  onBack,
  title,
  logo = false,
}: {
  children: React.ReactNode
  onBack?: () => void
  title?: string
  logo?: boolean
}) {
  return (
    <main className="min-h-svh bg-black text-white md:px-0 md:py-0">
      <div className="mx-auto flex min-h-svh w-full max-w-[390px] flex-col overflow-hidden px-5 py-7 md:grid md:min-h-svh md:max-w-none md:grid-cols-[minmax(0,1fr)_minmax(390px,32vw)] md:gap-[clamp(40px,5vw,96px)] md:bg-black md:px-[clamp(40px,6vw,112px)] md:py-[clamp(40px,6vh,80px)]">
        <aside className="hidden flex-col justify-center md:flex">
          <p className="text-sm font-semibold tracking-[0.24em] text-[#adadb8] uppercase">
            THE PICK
          </p>
          <p className="mt-7 text-5xl leading-[1.12] font-semibold tracking-tight">
            고객의 선택으로
            <br />더 확신 있게 홍보하세요.
          </p>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#adadb8]">
            두 가지 포스터를 등록하고 실제 고객의 선택을 확인해 보세요.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] p-4">
              <p className="text-sm font-semibold">사장님</p>
              <p className="mt-2 text-xs leading-5 text-[#adadb8]">
                홍보 포스터를 비교하고 더 나은 시안을 선택해요.
              </p>
            </div>
            <div className="rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] p-4">
              <p className="text-sm font-semibold">손님</p>
              <p className="mt-2 text-xs leading-5 text-[#adadb8]">
                포스터를 고르고 참여 리워드를 받아요.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col md:min-h-[664px] md:rounded-[18px] md:border md:border-[#3d3d42] md:bg-black md:px-5 md:py-7">
          <header className="flex min-h-8 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                aria-label="이전 화면"
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-white transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[#0a85ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                onClick={onBack}
              >
                <ChevronLeftIcon className="size-6" aria-hidden="true" />
              </button>
            ) : null}
            {logo ? (
              <Link
                href="/"
                className="rounded-md text-xl font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[#0a85ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                더픽
              </Link>
            ) : (
              <p className="text-xl font-semibold tracking-tight">{title}</p>
            )}
          </header>
          {children}
        </div>
      </div>
    </main>
  )
}

function PrimaryButton({
  children,
  disabled = false,
  onClick,
  render,
  type = "button",
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  render?: React.ReactElement
  type?: "button" | "submit"
}) {
  return (
    <Button
      type={type}
      size="lg"
      className="h-14 w-full rounded-2xl bg-[#0a85ff] text-[17px] font-semibold text-white hover:bg-[#0a85ff]/90"
      disabled={disabled}
      onClick={onClick}
      render={render}
    >
      {children}
    </Button>
  )
}

function RoleSelection({
  role,
  onSelect,
  onContinue,
  onExistingLogin,
}: {
  role: Role | null
  onSelect: (role: Role) => void
  onContinue: () => void
  onExistingLogin: () => void
}) {
  return (
    <PageShell logo>
      <section className="flex flex-1 flex-col pt-14">
        <h1 className="text-[28px] leading-[1.45] font-semibold tracking-tight">
          고객의 선택으로
          <br />더 확신 있게 홍보하세요.
        </h1>
        <p className="mt-4 text-sm text-[#adadb8]">
          포스터를 고르고, 투표하고, 리워드를 받아보세요.
        </p>

        <div className="mt-16 space-y-4">
          <RoleCard
            role="owner"
            selected={role === "owner"}
            onSelect={onSelect}
            icon={<StoreIcon className="size-8" aria-hidden="true" />}
            title="사장님으로 시작하기"
            description={["내 홍보 포스터를 등록하고", "고객 반응을 확인해요."]}
          />
          <RoleCard
            role="guest"
            selected={role === "guest"}
            onSelect={onSelect}
            icon={<UserRoundIcon className="size-8" aria-hidden="true" />}
            title="손님으로 시작하기"
            description={["가게 포스터에 투표하고", "포인트를 받아요."]}
          />
        </div>

        <p className="mt-auto text-[13px] text-[#adadb8]">
          나중에 역할을 추가하거나 변경할 수 있어요.
        </p>
        <button
          type="button"
          className="mt-7 self-start rounded-md text-sm font-semibold text-[#adadb8] transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[#0a85ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          onClick={onExistingLogin}
        >
          이미 계정이 있어요. 로그인
        </button>
        <PrimaryButton disabled={!role} onClick={onContinue}>
          선택하고 계속하기
          <ArrowRightIcon aria-hidden="true" />
        </PrimaryButton>
      </section>
    </PageShell>
  )
}

function RoleCard({
  role,
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  role: Role
  selected: boolean
  onSelect: (role: Role) => void
  icon: React.ReactNode
  title: string
  description: string[]
}) {
  return (
    <button
      type="button"
      className={`relative flex h-[132px] w-full items-start gap-4 rounded-[18px] border bg-[#1c1c1f] px-5 py-5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0a85ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        selected ? "border-[#0a85ff]" : "border-[#3d3d42]"
      }`}
      aria-pressed={selected}
      onClick={() => onSelect(role)}
    >
      <span className="mt-0.5 text-white">{icon}</span>
      <span>
        <span className="block text-[17px] font-semibold">{title}</span>
        <span className="mt-1 block text-[13px] leading-5 text-[#adadb8]">
          {description.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </span>
      {selected ? (
        <span className="absolute top-4 right-4 flex size-6 items-center justify-center rounded-xl bg-[#0a85ff]">
          <CheckIcon className="size-4" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  )
}

function AuthStep({
  role,
  returnTo,
  error,
  onBack,
  onChangeRole,
}: {
  role: Role
  returnTo: string
  error?: string
  onBack: () => void
  onChangeRole: () => void
}) {
  return (
    <PageShell onBack={onBack} title="더픽 시작하기">
      <section className="flex flex-1 flex-col pt-8">
        <div className="flex h-7 w-[108px] items-center justify-center rounded-full bg-[#0a85ff] text-xs font-semibold">
          {getRoleLabel(role)}
        </div>
        <div className="mt-9">
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            간편하게 시작해 보세요
          </h1>
          <p className="mt-2 text-sm text-[#adadb8]">
            처음이라면 자동으로 가입이 진행돼요.
          </p>
        </div>

        <div className="mt-12">
          {error ? (
            <p
              className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              로그인을 완료하지 못했습니다. 다시 시도해 주세요.
            </p>
          ) : null}
          <GoogleLoginButton nextPath={getAuthTarget(role, returnTo)} />
        </div>

        <p className="mt-auto text-[13px] leading-5 text-[#adadb8]">
          계속하면 서비스 이용약관 및
          <br />
          개인정보 처리방침에 동의하게 됩니다.
        </p>
        <button
          type="button"
          className="mt-36 self-center text-sm font-semibold text-[#adadb8] transition-colors hover:text-white"
          onClick={onChangeRole}
        >
          다른 역할로 시작하기
        </button>
      </section>
    </PageShell>
  )
}

function OwnerInfoStep({
  info,
  onChange,
  onBack,
  onNext,
}: {
  info: OwnerInfo
  onChange: (field: keyof OwnerInfo, value: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <PageShell onBack={onBack} title="가게 정보를 알려주세요">
      <form
        className="flex flex-1 flex-col pt-5"
        onSubmit={(event) => {
          event.preventDefault()
          onNext()
        }}
      >
        <p className="text-sm text-[#adadb8]">
          테스트 결과를 가게별로 관리할 수 있어요.
        </p>
        <label className="mt-9 text-[13px] font-semibold" htmlFor="store-name">
          가게 이름
        </label>
        <input
          id="store-name"
          className={`${baseInputClass} mt-2`}
          value={info.storeName}
          onChange={(event) => onChange("storeName", event.target.value)}
          placeholder="예: 민지의 딸기 카페"
          required
        />
        <label className="mt-2.5 text-[13px] font-semibold" htmlFor="category">
          업종
        </label>
        <select
          id="category"
          className={`${baseInputClass} mt-2 appearance-none`}
          value={info.category}
          onChange={(event) => onChange("category", event.target.value)}
        >
          <option>카페</option>
          <option>음식점</option>
          <option>뷰티</option>
          <option>쇼핑</option>
          <option>생활서비스</option>
        </select>
        <label
          className="mt-2.5 text-[13px] font-semibold"
          htmlFor="store-location"
        >
          가게 위치
        </label>
        <input
          id="store-location"
          className={`${baseInputClass} mt-2`}
          value={info.location}
          onChange={(event) => onChange("location", event.target.value)}
          placeholder="서울 성동구 성수동"
        />
        <label
          className="mt-2.5 text-[13px] font-semibold"
          htmlFor="business-status"
        >
          사업자 등록 여부{" "}
          <span className="font-normal text-[#adadb8]">선택</span>
        </label>
        <select
          id="business-status"
          className={`${baseInputClass} mt-2 appearance-none`}
          value={info.businessStatus}
          onChange={(event) => onChange("businessStatus", event.target.value)}
        >
          <option value="later">나중에 인증하기</option>
          <option value="registered">사업자 등록 완료</option>
        </select>
        <div className="mt-7 rounded-2xl bg-[#1a334f] px-4 py-4">
          <p className="text-sm font-semibold">
            사업자 인증은 나중에 해도 돼요
          </p>
          <p className="mt-2 text-xs text-[#adadb8]">
            처음에는 포스터 테스트 기능을 바로 이용할 수 있어요.
          </p>
        </div>
        <div className="mt-auto pt-8">
          <PrimaryButton type="submit">
            다음
            <ArrowRightIcon aria-hidden="true" />
          </PrimaryButton>
        </div>
      </form>
    </PageShell>
  )
}

function GuestInfoStep({
  info,
  onChange,
  onToggleInterest,
  onBack,
  onNext,
}: {
  info: GuestInfo
  onChange: (field: keyof GuestInfo, value: string) => void
  onToggleInterest: (interest: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(info.location)
  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return neighborhoodOptions

    return neighborhoodOptions.filter((location) =>
      location.toLowerCase().includes(query)
    )
  }, [searchQuery])

  function selectLocation(location: string) {
    setSearchQuery(location)
    setIsSearchOpen(false)
    onChange("location", location)
  }

  return (
    <PageShell onBack={onBack} title="관심 있는 동네를 알려주세요">
      <form
        className="flex flex-1 flex-col pt-5"
        onSubmit={(event) => {
          event.preventDefault()
          onNext()
        }}
      >
        <p className="text-sm text-[#adadb8]">
          내 생활권 가게의 투표를 먼저 보여드릴게요.
        </p>
        <p className="mt-9 text-sm font-semibold">활동 지역</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={`flex h-12 items-center justify-between rounded-[14px] border bg-[#26262b] px-4 text-left text-[15px] font-semibold transition-colors sm:min-w-0 ${
              info.location === "서울 성동구 성수동"
                ? "border-[#0a85ff]"
                : "border-[#3d3d42] hover:border-[#0a85ff]"
            }`}
            aria-pressed={info.location === "서울 성동구 성수동"}
            onClick={() => selectLocation("서울 성동구 성수동")}
          >
            <span className="flex min-w-0 items-center gap-2">
              <MapPinIcon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">현재 위치 사용</span>
            </span>
            {info.location === "서울 성동구 성수동" ? (
              <CheckIcon className="size-5 shrink-0" aria-hidden="true" />
            ) : null}
          </button>
          <button
            type="button"
            className={`flex h-12 items-center gap-2 rounded-[14px] border bg-[#26262b] px-4 text-left text-[15px] transition-colors ${
              isSearchOpen
                ? "border-[#0a85ff] text-white"
                : "border-[#3d3d42] text-[#adadb8] hover:border-[#0a85ff]"
            }`}
            aria-expanded={isSearchOpen}
            onClick={() => setIsSearchOpen((current) => !current)}
          >
            직접 동네 검색
            <SearchIcon className="ml-auto size-4" aria-hidden="true" />
          </button>
        </div>

        {isSearchOpen ? (
          <div className="mt-2 rounded-[14px] border border-[#3d3d42] bg-[#1c1c1f] p-2">
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#adadb8]"
                aria-hidden="true"
              />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="동네 이름을 검색해 주세요"
                className={`${baseInputClass} h-11 pl-10`}
                aria-label="동네 검색"
              />
            </div>
            <div className="mt-2 max-h-44 overflow-y-auto" role="listbox">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => (
                  <button
                    key={location}
                    type="button"
                    role="option"
                    aria-selected={info.location === location}
                    className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm text-[#adadb8] transition-colors hover:bg-[#26262b] hover:text-white"
                    onClick={() => selectLocation(location)}
                  >
                    <MapPinIcon
                      className="mr-2 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{location}</span>
                    {info.location === location ? (
                      <CheckIcon
                        className="ml-auto size-4 shrink-0 text-[#0a85ff]"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-sm text-[#adadb8]">
                  검색 결과가 없습니다.
                </p>
              )}
            </div>
          </div>
        ) : null}

        <p className="mt-7 text-sm font-semibold">관심 업종. 복수 선택</p>
        <div className="mt-3 grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:grid-cols-4">
          {interestOptions.map((interest) => {
            const selected = info.interests.includes(interest)

            return (
              <button
                key={interest}
                type="button"
                className={`h-[34px] rounded-full border text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[#0a85ff] bg-[#0a85ff] text-white"
                    : "border-[#3d3d42] bg-[#26262b] text-[#adadb8]"
                }`}
                aria-pressed={selected}
                onClick={() => onToggleInterest(interest)}
              >
                {interest}
              </button>
            )
          })}
        </div>

        <label className="mt-7 text-[13px] font-semibold" htmlFor="age">
          연령
        </label>
        <input
          id="age"
          className={`${baseInputClass} mt-2`}
          value={info.age}
          onChange={(event) => onChange("age", event.target.value)}
          placeholder="연령을 입력해주세요"
        />
        <label className="mt-2.5 text-[13px] font-semibold" htmlFor="gender">
          성별
        </label>
        <select
          id="gender"
          className={`${baseInputClass} mt-2 appearance-none`}
          value={info.gender}
          onChange={(event) => onChange("gender", event.target.value)}
        >
          <option value="">성별을 입력해주세요</option>
          <option>여성</option>
          <option>남성</option>
          <option>응답하지 않음</option>
        </select>
        <p className="mt-auto pt-7 text-xs text-[#adadb8]">
          입력한 정보는 나에게 맞는 투표를 보여주는 데 사용돼요.
        </p>
        <div className="pt-5">
          <PrimaryButton type="submit">
            다음
            <ArrowRightIcon aria-hidden="true" />
          </PrimaryButton>
        </div>
      </form>
    </PageShell>
  )
}

function TermsStep({
  role,
  checked,
  onToggle,
  onBack,
  onNext,
}: {
  role: Role
  checked: Record<string, boolean>
  onToggle: (term: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const allTerms = [...requiredTerms, optionalTerm]
  const requiredComplete = requiredTerms.every((term) => checked[term])
  const allChecked = allTerms.every((term) => checked[term])

  return (
    <PageShell onBack={onBack} title="서비스 이용을 위해 동의해 주세요">
      <section className="flex flex-1 flex-col pt-16">
        <button
          type="button"
          className="flex h-14 items-center gap-4 rounded-[14px] border border-[#3d3d42] bg-[#26262b] px-4 text-left"
          onClick={() => {
            const nextValue = !allChecked
            allTerms.forEach((term) => {
              if (Boolean(checked[term]) !== nextValue) onToggle(term)
            })
          }}
        >
          <span
            className={`flex size-6 items-center justify-center rounded-xl ${
              allChecked ? "bg-[#0a85ff]" : "border border-[#3d3d42]"
            }`}
          >
            {allChecked ? (
              <CheckIcon className="size-4" aria-hidden="true" />
            ) : null}
          </span>
          <span className="text-base font-semibold">전체 동의</span>
        </button>

        <div className="mt-5 space-y-1">
          {allTerms.map((term) => (
            <button
              key={term}
              type="button"
              className="flex min-h-[49px] w-full items-center gap-3 px-1 text-left"
              onClick={() => onToggle(term)}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-md border ${
                  checked[term]
                    ? "border-[#0a85ff] bg-[#0a85ff]"
                    : "border-[#3d3d42] bg-[#26262b]"
                }`}
              >
                {checked[term] ? (
                  <CheckIcon className="size-3.5" aria-hidden="true" />
                ) : null}
              </span>
              <span className="flex-1 text-sm">
                {term === optionalTerm ? "[선택]" : "[필수]"} {term}
              </span>
              <ChevronRightIcon
                className="size-4 text-[#adadb8]"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs text-[#adadb8]">
          {role === "guest"
            ? "손님 역할은 포인트 적립 및 부정 참여 제한 정책에 동의합니다."
            : "사장님 역할은 테스트 등록 및 결과 제공 정책이 적용됩니다."}
        </p>
        <div className="mt-auto pt-8">
          <PrimaryButton disabled={!requiredComplete} onClick={onNext}>
            {requiredComplete ? "가입 완료" : "필수 약관에 동의하면 가입 완료"}
            {requiredComplete ? <ArrowRightIcon aria-hidden="true" /> : null}
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  )
}

function CompletionStep({
  role,
  ownerInfo,
  onRoleSwitch,
}: {
  role: Role
  ownerInfo: OwnerInfo
  onRoleSwitch: () => void
}) {
  const isOwner = role === "owner"

  return (
    <PageShell title="더픽">
      <section className="flex flex-1 flex-col pt-12">
        <div
          className={`mx-auto flex size-[78px] items-center justify-center rounded-full ${
            isOwner ? "bg-[#1fab6b]" : "bg-[#0a85ff]"
          }`}
        >
          {isOwner ? (
            <CheckIcon className="size-10" aria-hidden="true" />
          ) : (
            <span className="text-2xl font-semibold">P</span>
          )}
        </div>
        <h1 className="mt-8 text-[26px] leading-[1.45] font-semibold tracking-tight">
          {isOwner ? (
            <>
              이제 고객의 선택을
              <br />
              받아볼 준비가 됐어요
            </>
          ) : (
            <>
              이제 투표하고
              <br />
              포인트를 받을 수 있어요
            </>
          )}
        </h1>
        <p className="mt-5 text-sm text-[#adadb8]">
          {isOwner
            ? "첫 A/B 테스트를 만들고 홍보물의 반응을 확인해 보세요."
            : "내 주변 가게의 포스터를 보고 더 끌리는 시안을 골라주세요."}
        </p>
        {isOwner ? (
          <div className="mt-16 rounded-2xl border border-[#3d3d42] bg-[#1c1c1f] px-4 py-4">
            <p className="text-base font-semibold">
              {ownerInfo.storeName || "민지의 딸기 카페"}
            </p>
            <p className="mt-2 text-sm text-[#adadb8]">
              {ownerInfo.category} /{" "}
              {ownerInfo.location || "서울 성동구 성수동"}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-[#1fab6b]">
              가게 정보 등록 완료
            </p>
          </div>
        ) : (
          <div className="mt-16 rounded-2xl bg-[#1a334f] px-4 py-4">
            <p className="text-base font-semibold">투표 참여 시 포인트 적립</p>
            <p className="mt-2 text-sm text-[#adadb8]">
              성실한 참여가 더 많은 리워드로 이어져요.
            </p>
            <p className="mt-2 text-[13px] font-semibold">
              1회 참여 / 최대 30P
            </p>
          </div>
        )}

        <div className="mt-auto space-y-4 pt-10">
          <PrimaryButton
            render={<Link href={isOwner ? "/owner/dashboard" : "/me"} />}
          >
            {isOwner ? "홈 대시보드로 이동" : "내 투표 홈으로 이동"}
            <ArrowRightIcon aria-hidden="true" />
          </PrimaryButton>
          <button
            type="button"
            className="block w-full text-center text-[15px] font-semibold text-[#adadb8] hover:text-white"
            onClick={onRoleSwitch}
          >
            다른 역할 추가하기
          </button>
          <p className="text-center text-xs text-[#adadb8]">
            프로필에서 {isOwner ? "손님" : "사장님"} 역할도 추가할 수 있어요.
          </p>
        </div>
      </section>
    </PageShell>
  )
}

function RoleSwitchStep({
  role,
  onSelect,
  onBack,
  onNext,
}: {
  role: Role
  onSelect: (role: Role) => void
  onBack: () => void
  onNext: () => void
}) {
  const alternateRole: Role = role === "owner" ? "guest" : "owner"

  return (
    <PageShell onBack={onBack} title="내 이용 역할">
      <section className="flex flex-1 flex-col pt-5">
        <p className="text-sm text-[#adadb8]">
          역할별 정보와 활동 내역은 안전하게 분리되어 관리됩니다.
        </p>
        <p className="mt-12 text-sm font-semibold">현재 사용 중</p>
        <RoleSummaryCard role={role} current />
        <p className="mt-8 text-sm font-semibold">추가할 수 있는 역할</p>
        <RoleSummaryCard
          role={alternateRole}
          onSelect={() => onSelect(alternateRole)}
        />
        <div className="mt-6 rounded-2xl bg-[#1a334f] px-4 py-4 text-sm text-[#adadb8]">
          한 계정에서 사장님과 손님 역할을 언제든지 전환할 수 있어요.
        </div>
        <div className="mt-auto pt-8">
          <PrimaryButton onClick={onNext}>
            이 역할로 계속하기
            <ArrowRightIcon aria-hidden="true" />
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  )
}

function RoleSummaryCard({
  role,
  current = false,
  onSelect,
}: {
  role: Role
  current?: boolean
  onSelect?: () => void
}) {
  const isOwner = role === "owner"
  const card = (
    <div
      className={`mt-3 rounded-2xl border px-5 py-5 ${
        current
          ? "border-[#0a85ff] bg-[#1c1c1f]"
          : "border-[#3d3d42] bg-[#1c1c1f]"
      }`}
    >
      <div className="flex items-start gap-4">
        {isOwner ? (
          <StoreIcon className="mt-1 size-8" aria-hidden="true" />
        ) : (
          <UserRoundIcon className="mt-1 size-8" aria-hidden="true" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-semibold">
              {isOwner ? "사장님" : "손님"}
            </p>
            {current ? (
              <span className="rounded-full bg-[#0a85ff] px-3 py-1 text-xs font-semibold">
                사용 중
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[#adadb8]">
            {isOwner
              ? "포스터 테스트와 결과 리포트를 관리해요."
              : "투표에 참여하고 포인트를 적립할 수 있어요."}
          </p>
          {!current ? (
            <button
              type="button"
              className="mt-4 h-9 w-full rounded-lg border border-[#3d3d42] text-sm font-semibold hover:border-[#0a85ff]"
              onClick={onSelect}
            >
              {isOwner ? "사장님 역할 추가하기" : "손님 역할 추가하기"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )

  return card
}

export function LoginFlow({
  initialRole,
  initialStep,
  error,
  returnTo,
}: LoginFlowProps) {
  const [step, setStep] = useState<FlowStep>(initialStep)
  const [role, setRole] = useState<Role | null>(initialRole)
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>({
    storeName: "",
    category: "카페",
    location: "",
    businessStatus: "later",
  })
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    location: "",
    interests: [],
    age: "",
    gender: "",
  })
  const [checkedTerms, setCheckedTerms] = useState<Record<string, boolean>>({})

  function goToRoleSelection() {
    setStep(1)
    setRole(null)
  }

  function goToTerms() {
    setStep(5)
  }

  function updateOwnerInfo(field: keyof OwnerInfo, value: string) {
    setOwnerInfo((current) => ({ ...current, [field]: value }))
  }

  function updateGuestInfo(field: keyof GuestInfo, value: string) {
    setGuestInfo((current) => ({ ...current, [field]: value }))
  }

  function toggleInterest(interest: string) {
    setGuestInfo((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  function toggleTerm(term: string) {
    setCheckedTerms((current) => ({ ...current, [term]: !current[term] }))
  }

  function continueFromRole() {
    if (role) setStep(2)
  }

  function continueAsExistingOwner() {
    setRole("owner")
    setStep(2)
  }

  if (step === 1) {
    return (
      <RoleSelection
        role={role}
        onSelect={setRole}
        onContinue={continueFromRole}
        onExistingLogin={continueAsExistingOwner}
      />
    )
  }

  if (step === 2 && role) {
    return (
      <AuthStep
        role={role}
        returnTo={returnTo}
        error={error}
        onBack={() => setStep(1)}
        onChangeRole={goToRoleSelection}
      />
    )
  }

  if (step === 4 && role === "owner") {
    return (
      <OwnerInfoStep
        info={ownerInfo}
        onChange={updateOwnerInfo}
        onBack={() => setStep(2)}
        onNext={goToTerms}
      />
    )
  }

  if (step === 4 && role === "guest") {
    return (
      <GuestInfoStep
        info={guestInfo}
        onChange={updateGuestInfo}
        onToggleInterest={toggleInterest}
        onBack={() => setStep(2)}
        onNext={goToTerms}
      />
    )
  }

  if (step === 5 && role) {
    return (
      <TermsStep
        role={role}
        checked={checkedTerms}
        onToggle={toggleTerm}
        onBack={() => setStep(4)}
        onNext={() => setStep(6)}
      />
    )
  }

  if (step === 6 && role) {
    return (
      <CompletionStep
        role={role}
        ownerInfo={ownerInfo}
        onRoleSwitch={() => setStep(7)}
      />
    )
  }

  if (step === 7 && role) {
    return (
      <RoleSwitchStep
        role={role}
        onSelect={setRole}
        onBack={() => setStep(6)}
        onNext={() => setStep(4)}
      />
    )
  }

  return null
}
