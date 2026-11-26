"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useT } from "@/components/i18n/locale-provider"
import { spaceDestinations, type Space } from "@/lib/shell/navigation"

// Five primary destinations for one space. Bottom bar on phones, column on desktop.
// Permission filtering comes from the shared shell helper; server checks still apply.
export function SpaceNav({ space }: { space: Space }) {
  const { t } = useT()
  const pathname = usePathname()
  const { churchId } = useParams<{ churchId?: string }>()
  const { data: session } = useSession()
  const items = spaceDestinations(space, churchId ?? "", session?.user?.role)

  if (items.length === 0) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:static md:flex-col md:border-0 md:bg-transparent md:pb-0">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium md:flex-none md:flex-row md:justify-start md:rounded-md md:px-3 md:text-sm ${
              active ? "text-primary md:bg-muted" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
