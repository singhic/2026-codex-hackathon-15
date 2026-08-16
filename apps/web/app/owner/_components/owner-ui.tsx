import {
  BarChart3Icon,
  ChevronLeftIcon,
  FileTextIcon,
  HomeIcon,
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
      <div className="mx-auto flex min-h-svh w-full max-w-[390px] flex-col bg-black">
        {backHref ? (
          <header className="flex min-h-[56px] items-center gap-2 px-5 pt-2">
            <Link
              href={backHref}
              aria-label="이전 화면"
              className="inline-flex size-7 items-center justify-center text-white transition-opacity hover:opacity-70"
            >
              <ChevronLeftIcon className="size-6" aria-hidden="true" />
            </Link>
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
            className="grid h-[72px] shrink-0 grid-cols-2 bg-[#141417] px-16 pt-3 pb-5"
          >
            <Link
              href="/owner/dashboard"
              className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                activeTab === "dashboard"
                  ? "font-semibold text-[#0091ff]"
                  : "text-[#adadb8]"
              }`}
            >
              <HomeIcon className="size-4" aria-hidden="true" />
              진행 중
            </Link>
            <Link
              href="/owner/tests"
              className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                activeTab === "tests"
                  ? "font-semibold text-[#0091ff]"
                  : "text-[#adadb8]"
              }`}
            >
              <FileTextIcon className="size-4" aria-hidden="true" />
              완료 리포트
            </Link>
          </nav>
        ) : null}
      </div>
    </main>
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
    <div className="min-w-0 rounded-xl border border-[#3d3d42] bg-[#26262b] px-2.5 py-3">
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
}: {
  label: string
  variant?: "a" | "b"
  compact?: boolean
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
      }`}
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
