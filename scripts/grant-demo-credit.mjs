import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import path from "node:path"

const args = process.argv.slice(2)

if (args.includes("--help")) {
  console.log(
    "Usage: pnpm demo:grant-credit -- --email owner@example.com [--amount 10000] [--linked]"
  )
  process.exit(0)
}

function readOption(name, fallback) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const email = readOption("--email")
const amountText = readOption("--amount", "10000")
const amount = Number(amountText)
const useLinkedProject = args.includes("--linked")

if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
  console.error("--email에 유효한 운영자 이메일을 입력해 주세요.")
  process.exit(1)
}

if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000) {
  console.error("--amount는 1 이상 1,000,000 이하의 정수여야 합니다.")
  process.exit(1)
}

const idempotencyKey = `demo-grant:${email}:${amount}`
const sql = `
do $grant$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower('${email}')
  limit 1;

  if target_user_id is null then
    raise exception 'DEMO_OWNER_NOT_FOUND';
  end if;

  perform private.grant_owner_credit(
    target_user_id,
    ${amount},
    '${idempotencyKey}',
    '데모 운영자 크레딧'
  );
end;
$grant$;
`

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)
const supabaseBinary = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.CMD" : "supabase"
)
const temporaryDirectory = mkdtempSync(
  path.join(tmpdir(), "the-pick-demo-credit-")
)
const sqlFile = path.join(temporaryDirectory, "grant-credit.sql")
writeFileSync(sqlFile, sql, "utf8")

const supabaseArgs = [
  "db",
  "query",
  useLinkedProject ? "--linked" : "--local",
  "--file",
  sqlFile,
]
const command = process.platform === "win32" ? "cmd.exe" : supabaseBinary
const commandArgs =
  process.platform === "win32"
    ? [
        "/d",
        "/s",
        "/c",
        [supabaseBinary, ...supabaseArgs].map(quoteCmdArg).join(" "),
      ]
    : supabaseArgs
let result
try {
  result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    stdio: "inherit",
  })
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)

function quoteCmdArg(value) {
  return /^[A-Za-z0-9_./:\\=-]+$/.test(value)
    ? value
    : `"${value.replaceAll('"', '""')}"`
}
