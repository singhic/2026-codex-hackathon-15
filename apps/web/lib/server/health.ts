export type HealthStatus = Readonly<{
  status: "ok" | "degraded"
  checks: {
    api: "ok"
    supabaseConfiguration: "ok" | "missing"
    databaseConnectivity: "ok" | "unreachable" | "skipped"
  }
  timestamp: string
}>

type HealthOptions = {
  env?: Readonly<Record<string, string | undefined>>
  fetcher?: typeof fetch
  timeoutMs?: number
}

export async function getHealthStatus({
  env = process.env,
  fetcher = fetch,
  timeoutMs = 3000,
}: HealthOptions = {}): Promise<HealthStatus> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    return {
      status: "degraded",
      checks: {
        api: "ok",
        supabaseConfiguration: "missing",
        databaseConnectivity: "skipped",
      },
      timestamp: new Date().toISOString(),
    }
  }

  let databaseConnectivity: "ok" | "unreachable" = "unreachable"

  try {
    const response = await fetcher(`${url}/rest/v1/rpc/healthcheck`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (response.ok) databaseConnectivity = "ok"
  } catch {
    databaseConnectivity = "unreachable"
  }

  return {
    status: databaseConnectivity === "ok" ? "ok" : "degraded",
    checks: {
      api: "ok",
      supabaseConfiguration: "ok",
      databaseConnectivity,
    },
    timestamp: new Date().toISOString(),
  }
}
