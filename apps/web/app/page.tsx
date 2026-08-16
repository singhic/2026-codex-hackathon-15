import { SplashIntro } from "./splash-intro"

export default function Page() {
  return (
    <main className="min-h-svh bg-[#474747]">
      <SplashIntro nextPath="/login" />
    </main>
  )
}
