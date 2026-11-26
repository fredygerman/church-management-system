import Link from "next/link"
import { redirect } from "next/navigation"
import { Home } from "lucide-react"

import { getChurches } from "@/actions/church"
import { getSession } from "@/auth"
import { ChurchSwitcher } from "@/components/layout/church-switcher"
import { SpaceNav } from "@/components/layout/space-nav"
import { Button } from "@/components/ui/button"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function PortalLayout({
  params,
  children,
}: PageProps & { children: React.ReactNode }) {
  const { churchId } = await params
  const t = await getTranslator()
  const session = await getSession()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const churches = await getChurches()
  const currentChurch = churches.find((church: any) => church.id === churchId) ?? null

  if (!currentChurch) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-72">
            <ChurchSwitcher churches={churches} currentChurch={currentChurch} />
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/" aria-label={t("nav.home")}>
                <Home className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 pt-6 md:grid-cols-[220px_1fr] md:pb-6">
        <SpaceNav space="member" />
        <section className="min-w-0">{children}</section>
      </main>
    </div>
  )
}
