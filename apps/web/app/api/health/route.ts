import { getHealthStatus } from "@/lib/server/health"

export const dynamic = "force-dynamic"

export function GET() {
  const health = getHealthStatus()

  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
