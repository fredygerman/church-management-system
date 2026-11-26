import Link from "next/link"

import { getTranslator } from "@/lib/i18n/server"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{ churchId: string }>
}

// Hub for member destinations that are not primary navigation items.
export default async function PortalMorePage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
  const items = [
    { href: `/${churchId}/portal/events`, label: t("nav.events") },
    { href: `/${churchId}/portal/library/resources`, label: t("wiring.nav.resources") },
    { href: `/${churchId}/portal/inbox`, label: t("wiring.nav.inbox") },
    { href: `/${churchId}/portal/prayer`, label: t("portal.nav.prayer") },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">{t("wiring.more.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("wiring.more.description")}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Button asChild variant="outline" className="h-auto min-h-11 w-full justify-start py-3">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
