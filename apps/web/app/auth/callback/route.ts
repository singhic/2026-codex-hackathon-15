import { NextResponse, type NextRequest } from "next/server"

import { getSafeNextPath } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const flowId = request.nextUrl.searchParams.get("sb_flow_id")
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    )

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url))
    }
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("error", "oauth_callback")

  return NextResponse.redirect(loginUrl)
}
