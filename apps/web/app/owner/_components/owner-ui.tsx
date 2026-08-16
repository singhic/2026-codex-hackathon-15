import {
  BarChart3Icon,
  ChevronLeftIcon,
  BadgeCheckIcon,
  TestTubesIcon,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type OwnerShellProps = {
  children: React.ReactNode
  activeTab?: "dashboard" | "tests" | "picks"
  backHref?: string
  headerTitle?: string
  headerAction?: React.ReactNode
  showTabs?: boolean
  storeId?: string
}

export function OwnerShell({
  children,
  activeTab = "dashboard",
  backHref,
  headerTitle,
  headerAction,
  showTabs = true,
  storeId,
}: OwnerShellProps) {
  const storeQuery = storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#303033] text-white">
      <div className="mx-auto flex min-h-svh w-full max-w-[390px] bg-black md:max-w-none md:bg-[#101014]">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="hidden items-center justify-between border-b border-white/10 bg-[#141417] px-[clamp(24px,5vw,96px)] py-5 md:flex">
            <Link href={`/owner/dashboard${storeQuery}`} aria-label="더픽 홈">
              <PickLogo />
            </Link>
            <div className="flex items-center gap-5 text-sm text-[#adadb8]">
              <Link href="/owner/wallet" className="hover:text-white">
                크레딧 내역
              </Link>
              <Link href="/owner/onboarding" className="hover:text-white">
                매장 설정
              </Link>
            </div>
          </div>

          {backHref || headerTitle ? (
            <header className="flex min-h-[56px] items-center gap-2 px-5 pt-2 md:mx-auto md:w-full md:max-w-none md:px-[clamp(40px,5vw,96px)] md:pt-8">
              {backHref ? (
                <Link
                  href={backHref}
                  aria-label="이전 화면"
                  className="inline-flex size-7 items-center justify-center text-white transition-opacity hover:opacity-70"
                >
                  <ChevronLeftIcon className="size-6" aria-hidden="true" />
                </Link>
              ) : null}
              <p className="min-w-0 flex-1 truncate text-lg font-semibold">
                {headerTitle}
              </p>
              {headerAction}
            </header>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>

          {showTabs ? (
            <nav
              aria-label="사장님 메뉴"
              className="sticky bottom-0 z-20 flex h-[72px] shrink-0 items-start justify-center gap-24 border-t border-white/10 bg-[#141417]/95 pt-3 pb-5 backdrop-blur md:h-[84px] md:gap-[clamp(96px,18vw,240px)] md:pt-4"
            >
              <MobileNavLink
                href={`/owner/tests${storeQuery}`}
                active={activeTab === "dashboard" || activeTab === "tests"}
                icon={<TestTubesIcon className="size-5" aria-hidden="true" />}
              >
                테스트
              </MobileNavLink>
              <MobileNavLink
                href={`/owner/picks${storeQuery}`}
                active={activeTab === "picks"}
                icon={<BadgeCheckIcon className="size-5" aria-hidden="true" />}
              >
                픽
              </MobileNavLink>
            </nav>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function MobileNavLink({
  children,
  href,
  icon,
  active,
}: {
  children: React.ReactNode
  href: string
  icon: React.ReactNode
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 text-xs transition-colors ${
        active ? "font-semibold text-[#0091ff]" : "text-[#adadb8]"
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}

export function PickLogo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-flex size-7 items-center justify-center rounded-full bg-[#0a85ff] text-black">
        <span className="absolute size-2 rounded-full bg-black" />
        <span className="absolute top-3 left-3 h-2.5 w-1.5 rotate-45 rounded-[2px] border-r-2 border-b-2 border-black" />
      </span>
      <span className="text-xl font-black tracking-[-0.04em] text-white">
        THE PICK
      </span>
    </span>
  )
}

export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(value, 100))

  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[#26262b]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className="h-full rounded-full bg-[#0091ff] transition-[width]"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[62px] min-w-0 rounded-xl border border-[#3d3d42] bg-[#26262b] px-2.5 py-3 md:px-4">
      <p className="truncate text-[11px] text-[#adadb8]">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

export function PosterPlaceholder({
  label,
  variant = "a",
  compact = false,
  className = "",
  imageSrc,
  imageAlt,
}: {
  label: string
  variant?: "a" | "b"
  compact?: boolean
  className?: string
  imageSrc?: string
  imageAlt?: string
}) {
  const resolvedImageSrc =
    imageSrc ??
    (variant === "a" ? "/posters/strawberry-a.png" : "/posters/strawberry-b.png")

  return (
    <div
      role="img"
      aria-label={`${label} 포스터 미리보기`}
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-[#3b3b40] bg-[#111114] text-center text-sm text-[#adadb8] ${
        compact ? "h-[78px] w-[84px]" : "h-[196px] w-full"
      } ${
        variant === "a"
          ? "bg-[linear-gradient(145deg,#313944,#252930)]"
          : "bg-[linear-gradient(145deg,#3b302d,#292426)]"
      } ${className}`}
    >
      {resolvedImageSrc ? (
        <Image
          src={resolvedImageSrc}
          alt={imageAlt ?? label}
          fill
          sizes={compact ? "84px" : "(min-width: 768px) 360px, 50vw"}
          className="object-cover object-center"
        />
      ) : (
        <span>{label}</span>
      )}
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-white">{children}</h2>
}

export function SecondaryLink({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-semibold text-[#adadb8] transition-colors hover:text-white"
    >
      {children}
      <BarChart3Icon className="size-4" aria-hidden="true" />
    </Link>
  )
}
