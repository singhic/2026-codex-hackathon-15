"use client"

import * as React from "react"
import { MonitorIcon, MoonIcon, SunIcon, SunMoonIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { buttonVariants } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={buttonVariants({
          variant: "outline",
          size: "icon",
          className: "size-10",
        })}
        aria-label="테마 변경"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <SunMoonIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuLabel>화면 테마</DropdownMenuLabel>
          <DropdownMenuRadioItem value="light" closeOnClick>
            <SunIcon aria-hidden="true" />
            라이트
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick>
            <MoonIcon aria-hidden="true" />
            다크
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick>
            <MonitorIcon aria-hidden="true" />
            시스템
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
