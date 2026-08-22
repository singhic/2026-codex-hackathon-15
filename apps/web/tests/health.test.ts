import assert from "node:assert/strict"
import test from "node:test"

import { getHealthStatus } from "../lib/server/health.ts"

const configuredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
}

test("Supabase 설정이 없으면 연결 확인을 건너뛰고 degraded를 반환한다", async () => {
  const health = await getHealthStatus({ env: {} })

  assert.equal(health.status, "degraded")
  assert.equal(health.checks.supabaseConfiguration, "missing")
  assert.equal(health.checks.databaseConnectivity, "skipped")
})

test("healthcheck RPC가 응답하면 readiness가 ok다", async () => {
  const health = await getHealthStatus({
    env: configuredEnv,
    fetcher: async () => new Response("true", { status: 200 }),
  })

  assert.equal(health.status, "ok")
  assert.equal(health.checks.databaseConnectivity, "ok")
})

test("healthcheck RPC가 실패하면 API 프로세스가 살아 있어도 degraded다", async () => {
  const health = await getHealthStatus({
    env: configuredEnv,
    fetcher: async () => new Response(null, { status: 503 }),
  })

  assert.equal(health.status, "degraded")
  assert.equal(health.checks.api, "ok")
  assert.equal(health.checks.databaseConnectivity, "unreachable")
})
