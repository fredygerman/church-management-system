import Link from "next/link"
import { notFound } from "next/navigation"

import { getPublicChurch } from "@/actions/public-churches"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ publicId: string }>
}

// Unpublished, deleted and unknown churches all return null from the API and render the same not-found page.
export default async function PublicChurchPage({ params }: PageProps) {
  const { publicId } = await params
  const t = await getTranslator()
  const church = await getPublicChurch(publicId)
  if (!church) notFound()

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Button asChild variant="ghost" size="sm">
        <Link href="/churches">{t("wiring.public.back")}</Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{church.name}</h1>
        <p className="text-muted-foreground text-sm">{church.location ?? t("wiring.public.notListed")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("wiring.public.about")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground whitespace-pre-line text-sm">{church.about ?? t("wiring.public.notListed")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("wiring.public.contact")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            {t("wiring.public.phone")}: {church.contact.phone ?? t("wiring.public.notListed")}
          </p>
          <p>
            {t("wiring.public.email")}: {church.contact.email ?? t("wiring.public.notListed")}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-foreground text-lg font-semibold">{t("wiring.public.events")}</h2>
        {church.events.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("wiring.public.noEvents")}</p>
        ) : (
          <ul className="space-y-3">
            {church.events.map((event) => (
              <li key={event.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="text-muted-foreground">{new Date(event.startsAt).toLocaleString()}</p>
                    {event.location ? <p>{event.location}</p> : null}
                    {event.description ? <p className="text-foreground">{event.description}</p> : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
