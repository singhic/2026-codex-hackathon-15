export type TestPeriod = {
  startDate: string
  endDate: string
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

export function dateValueToUtc(value: string) {
  const parts = value.split("-").map(Number)
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    ![year, month, day].every(Number.isFinite)
  ) {
    return Number.NaN
  }

  return Date.UTC(year, month - 1, day)
}

export function addDaysToDateValue(value: string, days: number) {
  const timestamp = dateValueToUtc(value)

  if (!Number.isFinite(timestamp)) return value

  return new Date(timestamp + days * dayInMilliseconds)
    .toISOString()
    .slice(0, 10)
}

export function getPeriodDays(period: TestPeriod) {
  const start = dateValueToUtc(period.startDate)
  const end = dateValueToUtc(period.endDate)

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0
  }

  return Math.floor((end - start) / dayInMilliseconds) + 1
}

export function createDefaultTestPeriod(now = new Date()): TestPeriod {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error("현재 날짜를 계산하지 못했습니다.")
  }

  const startDate = `${year}-${month}-${day}`
  return { startDate, endDate: addDaysToDateValue(startDate, 2) }
}
