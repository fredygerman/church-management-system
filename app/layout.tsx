import type { Metadata } from "next"

import { cn } from "@/lib/utils"
import Providers from "@/components/providers/providers"

import "./globals.css"

import { getSession } from "@/auth"

import { Toaster } from "@/components/ui/sonner"
import { fontMono, fontSans } from "@/styles/fonts"

export const metadata: Metadata = {
  title: "Church Management System",
  description: "A church management system",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable
        )}
      >
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          session={session}
        >
          <div className="relative flex min-h-screen flex-col">{children}</div>
        </Providers>
        <Toaster richColors />
      </body>
    </html>
  )
}