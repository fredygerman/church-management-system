import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell, CalendarCheck, CalendarDays, HeartHandshake, Home, Target, UserRound, UsersRound, Building2, HandCoins } from "lucide-react"

import { getChurches } from "@/actions/church"
import { getSession } from "@/auth"
import { ChurchSwitcher } from "@/components/layout/church-switcher"
import { Button } from "@/components/ui/button"
import { hasPermission, type PermissionAction } from "@/lib/permissions"
import { getTranslator } from "@/lib/i18n/server"
import type { MessageKey } from "@church/config"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

const portalLinks: { href: string; label: MessageKey; icon: typeof UserRound; permission?: PermissionAction }[] = [
  { href: "profile", label: "portal.nav.profile", icon: UserRound },
  { href: "family", label: "portal.nav.family", icon: UsersRound },
  { href: "attendance", label: "portal.nav.attendance", icon: CalendarCheck },
  { href: "prayer", label: "portal.nav.prayer", icon: HeartHandshake },
  { href: "announcements", label: "portal.nav.announcements", icon: Bell },
  { href: "departments", label: "portal.nav.departments", icon: Building2, permission: "read:department" },
  { href: "offerings", label: "portal.nav.giving", icon: HandCoins, permission: "read:own-giving-history" },
  { href: "giving-goals", label: "portal.nav.givingGoals", icon: Target, permission: "view:giving-goals" },
  { href: "events", label: "portal.nav.events", icon: CalendarDays, permission: "view:events" },
]

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
              <Link href="/">
                <Home className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {portalLinks
            .filter((item) => !item.permission || hasPermission(session.user.role, item.permission))
            .map((item) => {
            const Icon = item.icon
            return (
              <Button key={item.href} asChild variant="ghost" className="justify-start">
                <Link href={`/${churchId}/portal/${item.href}`}>
                  <Icon className="mr-2 size-4" />
                  {t(item.label)}
                </Link>
              </Button>
            )
          })}
        </nav>
        <section className="min-w-0">{children}</section>
      </main>
    </div>
  )
}
