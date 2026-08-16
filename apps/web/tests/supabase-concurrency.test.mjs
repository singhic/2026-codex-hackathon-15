import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { createHmac, randomUUID } from "node:crypto"
import { spawnSync } from "node:child_process"
import path from "node:path"
import process from "node:process"
import test, { after, before } from "node:test"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"

const WEB_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(WEB_DIR, "../../..")
const SETUP_FILE = path.join(
  ROOT_DIR,
  "supabase/tests/integration/setup_concurrency.sql"
)
const CLEANUP_FILE = path.join(
  ROOT_DIR,
  "supabase/tests/integration/cleanup_concurrency.sql"
)
const OWNER = "70000000-0000-4000-8000-000000000000"
const CUSTOMER_ONE = "71000000-0000-4000-8000-000000000001"
const CUSTOMER_TWO = "72000000-0000-4000-8000-000000000002"
const TEST_ID = "74000000-0000-4000-8000-000000000004"
const START_TEST_ID = "74100000-0000-4000-8000-000000000014"
const OPTION_A = "75000000-0000-4000-8000-000000000005"
const TEST_SLUG = "concurrency-test"
const SAME_KEY = "77000000-0000-4000-8000-000000000007"
const START_KEY = "77100000-0000-4000-8000-000000000017"

let local

before(() => {
  local = readLocalStatus()
  runSupabase(["db", "query", "--local", "--file", SETUP_FILE])
})

after(() => {
  if (local) {
    runSupabase(["db", "query", "--local", "--file", CLEANUP_FILE])
  }
})

test("동일 시작 멱등 키의 동시 요청은 크레딧을 한 번만 차감한다", async () => {
  const client = authenticatedClient(OWNER)
  const results = await Promise.all(
    Array.from({ length: 12 }, () =>
      client.schema("api").rpc("start_test", {
        p_test_id: START_TEST_ID,
        p_idempotency_key: START_KEY,
      })
    )
  )

  for (const result of results) {
    assert.equal(result.error, null)
    assert.equal(result.data.status, "active")
    assert.equal(result.data.ownerCreditBalance, 5000)
  }

  const { data: wallet, error } = await client
    .schema("api")
    .rpc("get_owner_wallet")
  assert.equal(error, null)
  assert.equal(wallet.balance, 5000)
  assert.equal(
    wallet.entries.filter((entry) => entry.type === "test_charge").length,
    1
  )
})

test("동일 투표 멱등 키의 동시 요청은 투표와 보상을 한 번만 기록한다", async () => {
  const client = authenticatedClient(CUSTOMER_ONE)
  const results = await Promise.all(
    Array.from({ length: 16 }, () =>
      client.schema("api").rpc("submit_vote", {
        p_slug: TEST_SLUG,
        p_option_id: OPTION_A,
        p_idempotency_key: SAME_KEY,
      })
    )
  )

  for (const result of results) {
    assert.equal(result.error, null)
  }
  assert.equal(new Set(results.map(({ data }) => data.voteId)).size, 1)

  const ownerClient = authenticatedClient(OWNER)
  const { data: progress, error: progressError } = await ownerClient
    .schema("api")
    .rpc("get_test_progress", { p_test_id: TEST_ID })
  assert.equal(progressError, null)
  assert.equal(progress.voteCount, 1)

  const { data: wallet, error: walletError } = await client
    .schema("api")
    .rpc("get_reward_wallet")
  assert.equal(walletError, null)
  assert.equal(wallet.balance, 10)
  assert.equal(wallet.entries.length, 1)
})

test("서로 다른 멱등 키의 동시 중복 투표는 하나만 성공한다", async () => {
  const client = authenticatedClient(CUSTOMER_TWO)
  const results = await Promise.all(
    Array.from({ length: 12 }, () =>
      client.schema("api").rpc("submit_vote", {
        p_slug: TEST_SLUG,
        p_option_id: OPTION_A,
        p_idempotency_key: randomUUID(),
      })
    )
  )

  const successes = results.filter(({ error }) => error === null)
  const failures = results.filter(({ error }) => error !== null)
  assert.equal(successes.length, 1)
  assert.equal(failures.length, 11)
  for (const { error } of failures) {
    assert.match(error.message, /^ALREADY_VOTED/)
  }

  const ownerClient = authenticatedClient(OWNER)
  const { data: progress, error: progressError } = await ownerClient
    .schema("api")
    .rpc("get_test_progress", { p_test_id: TEST_ID })
  assert.equal(progressError, null)
  assert.equal(progress.voteCount, 2)

  const { data: wallet, error: walletError } = await client
    .schema("api")
    .rpc("get_reward_wallet")
  assert.equal(walletError, null)
  assert.equal(wallet.balance, 10)
  assert.equal(wallet.entries.length, 1)
})

function authenticatedClient(userId) {
  const token = signJwt(
    {
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      sub: userId,
      role: "authenticated",
      aal: "aal1",
      session_id: randomUUID(),
      email: `${userId}@example.test`,
      app_metadata: { provider: "google", providers: ["google"] },
      user_metadata: {},
    },
    local.JWT_SECRET
  )

  return createClient(local.API_URL, local.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

function readLocalStatus() {
  const output = runSupabase(["status", "-o", "json"])
  const jsonStart = output.indexOf("{")
  if (jsonStart < 0) {
    throw new Error("Supabase local status did not return JSON")
  }
  const status = JSON.parse(output.slice(jsonStart))
  for (const key of ["API_URL", "ANON_KEY", "JWT_SECRET"]) {
    if (!status[key])
      throw new Error(`Missing local Supabase status field: ${key}`)
  }
  return status
}

function runSupabase(args) {
  const pnpmArgs = ["exec", "supabase", ...args]
  const isWindows = process.platform === "win32"
  const command = isWindows ? "cmd.exe" : "pnpm"
  const commandArgs = isWindows
    ? ["/d", "/s", "/c", ["pnpm", ...pnpmArgs].map(quoteCmdArg).join(" ")]
    : pnpmArgs
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  })
  if (result.status !== 0) {
    throw new Error(
      [result.stderr, result.stdout].filter(Boolean).join("\n") ||
        "Supabase CLI failed"
    )
  }
  return result.stdout
}

function quoteCmdArg(value) {
  return /^[A-Za-z0-9_./:\\=-]+$/.test(value)
    ? value
    : `"${value.replaceAll('"', '""')}"`
}

function signJwt(payload, secret) {
  const header = encodeJson({ alg: "HS256", typ: "JWT" })
  const body = encodeJson(payload)
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url")
  return `${header}.${body}.${signature}`
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}
