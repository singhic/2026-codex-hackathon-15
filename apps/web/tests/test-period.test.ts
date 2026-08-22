import assert from "node:assert/strict"
import test from "node:test"

import {
  addDaysToDateValue,
  createDefaultTestPeriod,
  getPeriodDays,
} from "../lib/test-period.ts"

test("서울 날짜를 기준으로 기본 3일 기간을 만든다", () => {
  const period = createDefaultTestPeriod(new Date("2026-08-21T15:00:00Z"))

  assert.deepEqual(period, {
    startDate: "2026-08-22",
    endDate: "2026-08-24",
  })
  assert.equal(getPeriodDays(period), 3)
})

test("월 경계를 넘어 날짜를 더한다", () => {
  assert.equal(addDaysToDateValue("2026-08-31", 1), "2026-09-01")
})

test("종료일이 시작일보다 빠르면 유효한 기간으로 계산하지 않는다", () => {
  assert.equal(
    getPeriodDays({ startDate: "2026-08-22", endDate: "2026-08-21" }),
    0
  )
})
