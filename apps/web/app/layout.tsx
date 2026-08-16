import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "15 Fullstack | A/B Test Studio",
  description: "고객 투표로 더 효과적인 홍보 포스터를 선택하세요.",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className="antialiased"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif",
      }}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
