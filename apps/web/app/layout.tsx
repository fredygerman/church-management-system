import type { Metadata } from "next"
import { cn } from "@/lib/utils"
import Providers from "@/components/providers/providers"
import { getSession } from "@/auth"
import "./globals.css"
import { Red_Hat_Display } from "next/font/google"

const redHatDisplay = Red_Hat_Display({ subsets: ["latin"] })


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
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
          {children}
        </Providers>
      </body>
    </html>
  )
}
