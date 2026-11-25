import type { Metadata } from "next"
import { cn } from "@/lib/utils"
import Providers from "@/components/providers/providers"
import { getSession } from "@/auth"
import { getLocale } from "@/lib/i18n/server"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import "./globals.css"
import { Red_Hat_Display } from "next/font/google"

const redHatDisplay = Red_Hat_Display({ subsets: ["latin"] })


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <head />
      <body
        suppressHydrationWarning
        className={cn( 
          "h-full bg-background font-sans text-foreground antialiased",
          redHatDisplay.className
        )}
      >
        <Providers
          session={session}
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </Providers>
      </body>
    </html>
  )
}
