import { regions } from "@/lib/regions"

type RegionSelectProps = Omit<
  React.ComponentPropsWithoutRef<"select">,
  "onChange"
> & {
  onChange: (regionCode: string) => void
}

export function RegionSelect({
  className,
  onChange,
  ...props
}: RegionSelectProps) {
  return (
    <select
      {...props}
      className={[
        "h-11 w-full rounded-lg border border-[#3d3d42] bg-[#26262b] px-3 text-sm text-white transition-colors outline-none",
        "focus-visible:border-[#0a85ff] focus-visible:ring-3 focus-visible:ring-[#0a85ff]/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">지역을 선택해 주세요</option>
      {regions.map((region) => (
        <option key={region.code} value={region.code}>
          {region.label}
        </option>
      ))}
    </select>
  )
}
