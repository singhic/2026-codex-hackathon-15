import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "./database.types"
import { getSupabasePublicEnv } from "./env"

export async function createClient() {
  const cookieStore = await cookies()
  const { url, publishableKey } = getSupabasePublicEnv()

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Component에서는 쿠키 쓰기가 제한됩니다. 세션 갱신은
          // Route Handler 또는 Server Action 경계에서 처리합니다.
        }
      },
    },
  })
}
