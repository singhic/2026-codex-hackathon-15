"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type SplashPhase = "enter" | "show" | "exit" | "done"

export function SplashIntro({ nextPath = "/login" }: { nextPath?: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<SplashPhase>("enter")

  useEffect(() => {
    const showTimer = window.setTimeout(() => setPhase("show"), 40)
    const exitTimer = window.setTimeout(() => setPhase("exit"), 950)
    const doneTimer = window.setTimeout(() => {
      setPhase("done")
      router.replace(nextPath)
    }, 1450)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(exitTimer)
      window.clearTimeout(doneTimer)
    }
  }, [nextPath, router])

  if (phase === "done") return null

  const logoVisible = phase === "show"

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#474747] transition-opacity duration-500 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="더픽 시작 화면"
    >
      <div className="relative flex aspect-[390/844] h-[min(844px,calc(100svh-40px))] w-auto max-w-[calc(100vw-40px)] items-center justify-center overflow-hidden rounded-[18px] bg-black md:aspect-auto md:h-full md:w-full md:max-w-none md:rounded-none">
        <p
          className={`text-[52px] leading-none font-black tracking-[-0.07em] text-white transition-all duration-700 ease-out md:text-[60px] ${
            logoVisible ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
        >
          THE PICK
        </p>
      </div>
    </div>
  )
}
