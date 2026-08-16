export type HealthStatus = Readonly<{
  status: "ok" | "degraded"
  checks: {
    api: "ok"
    supabaseConfiguration: "ok" | "missing"
  }
  timestamp: string
}>

export function getHealthStatus(): HealthStatus {
  const hasSupabaseConfiguration = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )

  return {
    status: hasSupabaseConfiguration ? "ok" : "degraded",
    checks: {
      api: "ok",
      supabaseConfiguration: hasSupabaseConfiguration ? "ok" : "missing",
    },
    timestamp: new Date().toISOString(),
  }
}
