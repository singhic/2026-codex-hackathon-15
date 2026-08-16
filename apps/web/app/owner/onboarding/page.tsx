import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import { OwnerShell } from "../_components/owner-ui"
import { OnboardingForm } from "./onboarding-form"

export default async function OwnerOnboardingPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const ownerId = claimsData?.claims.sub

  if (!ownerId) {
    redirect("/login?next=%2Fowner%2Fonboarding")
  }

  return (
    <OwnerShell showTabs={false} headerTitle="사장님 온보딩">
      <section className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 md:mx-auto md:w-full md:max-w-[1180px] md:px-10 md:py-14">
        <OnboardingForm />
      </section>
    </OwnerShell>
  )
}
