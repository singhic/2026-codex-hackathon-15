import {
  BarChart3Icon,
  ChevronLeftIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
} from "lucide-react"
import Link from "next/link"

type OwnerShellProps = {
  children: React.ReactNode
  activeTab?: "dashboard" | "tests"
  backHref?: string
  headerTitle?: string
  headerAction?: React.ReactNode
  showTabs?: boolean
}

export function OwnerShell({
  children,
  activeTab = "dashboard",
  backHref,
  headerTitle,
  headerAction,
  showTabs = true,
}: OwnerShellProps) {
  return (
    <main className="min-h-svh bg-[#303033] text-white">
      <div className="mx-auto flex min-h-svh w-full max-w-[390px] bg-black md:max-w-none md:bg-[#101014]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#141417] px-6 py-8 md:flex">
          <Link href="/owner/dashboard" className="block">
            <p className="text-xl font-black tracking-tight">THE PICK</p>
            <p className="mt-2 text-xs text-[#adadb8]">사장님 스튜디오</p>
          </Link>

          <nav aria-label="사장님 데스크톱 메뉴" className="mt-12 space-y-2">
            <DesktopNavLink
              href="/owner/dashboard"
              active={activeTab === "dashboard"}
              icon={<HomeIcon className="size-5" aria-hidden="true" />}
            >
              진행 중
            </DesktopNavLink>
            <DesktopNavLink
              href="/owner/tests"
              active={activeTab === "tests"}
              icon={<FileTextIcon className="size-5" aria-hidden="true" />}
            >
              완료 리포트
            </DesktopNavLink>
          </nav>

          <div className="mt-auto border-t border-white/10 pt-5">
            <Link
              href="/owner/onboarding"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#adadb8] transition-colors hover:bg-white/5 hover:text-white"
            >
              <SettingsIcon className="size-5" aria-hidden="true" />
              매장 설정
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
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
              className="grid h-[72px] shrink-0 grid-cols-2 bg-[#141417] px-16 pt-3 pb-5 md:hidden"
            >
              <MobileNavLink
                href="/owner/dashboard"
                active={activeTab === "dashboard"}
                icon={<HomeIcon className="size-4" aria-hidden="true" />}
              >
                진행 중
              </MobileNavLink>
              <MobileNavLink
                href="/owner/tests"
                active={activeTab === "tests"}
                icon={<FileTextIcon className="size-4" aria-hidden="true" />}
              >
                완료 리포트
              </MobileNavLink>
            </nav>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function DesktopNavLink({
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
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
        active
          ? "bg-[#0a85ff]/15 font-semibold text-[#2b9bff]"
          : "text-[#adadb8] hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </Link>
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
      className={`flex flex-col items-center gap-1 text-xs transition-colors ${
        active ? "font-semibold text-[#0091ff]" : "text-[#adadb8]"
      }`}
    >
      {icon}
      {children}
    </Link>
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
}: {
  label: string
  variant?: "a" | "b"
  compact?: boolean
  className?: string
}) {
  return (
    <div
      role="img"
      aria-label={`${label} 포스터 미리보기`}
      className={`flex items-center justify-center overflow-hidden rounded-xl border border-[#3b3b40] text-center text-sm text-[#adadb8] ${
        compact ? "h-[78px] w-[84px]" : "h-[196px] w-full"
      } ${
        variant === "a"
          ? "bg-[linear-gradient(145deg,#313944,#252930)]"
          : "bg-[linear-gradient(145deg,#3b302d,#292426)]"
      } ${className}`}
    >
      <span>{label}</span>
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
