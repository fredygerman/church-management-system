import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell, CalendarCheck, HeartHandshake, Home, UserRound, UsersRound, Building2 } from "lucide-react"

import { getChurches } from "@/actions/church"
import { getSession } from "@/auth"
import { ChurchSwitcher } from "@/components/layout/church-switcher"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

const portalLinks = [
  { href: "profile", label: "Profile", icon: UserRound },
  { href: "family", label: "Family", icon: UsersRound },
  { href: "attendance", label: "Attendance", icon: CalendarCheck },
  { href: "prayer", label: "Prayer", icon: HeartHandshake },
  { href: "announcements", label: "Announcements", icon: Bell },
  { href: "departments", label: "Departments", icon: Building2 },
]

export default async function PortalLayout({
  params,
  children,
}: PageProps & { children: React.ReactNode }) {
  const { churchId } = await params
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
          {portalLinks.map((item) => {
            const Icon = item.icon
            return (
              <Button key={item.href} asChild variant="ghost" className="justify-start">
                <Link href={`/${churchId}/portal/${item.href}`}>
                  <Icon className="mr-2 size-4" />
                  {item.label}
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
