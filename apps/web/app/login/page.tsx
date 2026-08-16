import { redirect } from "next/navigation"

import { getSafeNextPath } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/server"

import { LoginFlow } from "./login-flow"

type Role = "owner" | "guest"
type FlowStep = 1 | 2 | 4 | 5 | 6 | 7

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[]
    next?: string | string[]
    role?: string | string[]
    returnTo?: string | string[]
    step?: string | string[]
  }>
}

function getRole(value: string | string[] | undefined): Role | null {
  const role = Array.isArray(value) ? value[0] : value
  return role === "owner" || role === "guest" ? role : null
}

function getStep(value: string | string[] | undefined): FlowStep {
  const step = Number(Array.isArray(value) ? value[0] : value)
  return step === 2 || step === 4 || step === 5 || step === 6 || step === 7
    ? step
    : 1
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next, role, returnTo, step } = await searchParams
  const requestedNextPath = Array.isArray(next) ? next[0] : next
  const nextPath = getSafeNextPath(requestedNextPath)
  const selectedRole = getRole(role)
  const selectedStep = getStep(step)
  const hasFlowState = Boolean(selectedRole && selectedStep !== 1)
  const returnPath = getSafeNextPath(
    Array.isArray(returnTo) ? returnTo[0] : returnTo,
    nextPath
  )
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (claimsData?.claims && requestedNextPath && !hasFlowState) {
    redirect(nextPath)
  }

  return (
    <LoginFlow
      initialRole={selectedRole}
      initialStep={selectedRole ? selectedStep : 1}
      error={Array.isArray(error) ? error[0] : error}
      returnTo={returnPath}
    />
  )
}
