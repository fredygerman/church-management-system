"use client"

import * as React from "react"
import { type Session } from "next-auth"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import AuthProvider from "./auth-provider"

export default function Providers({
  session,
  children,
  ...props
}: {
  session: Session | null
  children: React.ReactNode
} & ThemeProviderProps) {
  return (
    <AuthProvider session={session}>
      <NextThemesProvider {...props}>
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
        <Toaster richColors />
      </NextThemesProvider>
    </AuthProvider>
  )
}
