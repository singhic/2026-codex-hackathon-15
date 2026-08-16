"use client"

import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { createClient } from "@/lib/supabase/client"

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.93a6.02 6.02 0 0 1 0-3.86V7.45H3.05a10 10 0 0 0 0 9.1l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.45l3.35 2.62C7.19 7.7 9.4 5.94 12 5.94Z"
      />
    </svg>
  )
}

type GoogleLoginButtonProps = {
  nextPath: string
}

export function GoogleLoginButton({ nextPath }: GoogleLoginButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setIsPending(true)
    setErrorMessage(null)

    const supabase = createClient()
    const redirectTo = new URL("/auth/callback", window.location.origin)
    redirectTo.searchParams.set("next", nextPath)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
      },
    })

    if (error) {
      setErrorMessage(
        "Google 로그인을 시작하지 못했습니다. 다시 시도해 주세요."
      )
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        size="lg"
        className="h-14 w-full rounded-2xl bg-white text-base font-semibold text-[#1f1f1f] hover:bg-white/90"
        disabled={isPending}
        aria-busy={isPending}
        onClick={handleGoogleLogin}
      >
        <GoogleIcon />
        {isPending ? "Google로 이동 중..." : "Google로 계속하기"}
      </Button>
      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
