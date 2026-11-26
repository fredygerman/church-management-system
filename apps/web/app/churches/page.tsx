import Link from "next/link"

import { listPublicChurches } from "@/actions/public-churches"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  searchParams: Promise<{ query?: string; offset?: string }>
}

const PAGE_SIZE = 20

// Public, unauthenticated browse page. Only the API's published projection is rendered.
export default async function PublicChurchesPage({ searchParams }: PageProps) {
  const { query, offset } = await searchParams
  const t = await getTranslator()
  const start = Math.max(0, Number.parseInt(offset ?? "0", 10) || 0)
  const search = query?.trim() || undefined
  const result = await listPublicChurches({ query: search, offset: start, limit: PAGE_SIZE })

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-foreground text-2xl font-semibold">{t("wiring.public.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("wiring.public.intro")}</p>
      </header>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <Input type="search" name="query" aria-label={t("wiring.public.search")} defaultValue={search ?? ""} />
        <Button type="submit" variant="outline">
          {t("wiring.public.search")}
        </Button>
      </form>

      {!result ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{t("wiring.public.loadError")}</p>
          </CardContent>
        </Card>
      ) : result.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{search ? t("wiring.public.noMatch") : t("wiring.public.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {result.items.map((church) => (
            <li key={church.publicId}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Link href={`/churches/${encodeURIComponent(church.publicId)}`} className="hover:underline">
                      {church.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-muted-foreground text-sm">{church.location ?? t("wiring.public.notListed")}</p>
                  {church.about ? <p className="text-foreground line-clamp-3 text-sm">{church.about}</p> : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {result?.pagination.hasNext ? (
        <Button asChild variant="outline">
          <Link
            href={`/churches?${new URLSearchParams({ ...(search ? { query: search } : {}), offset: String(start + PAGE_SIZE) })}`}
          >
            {t("wiring.public.loadMore")}
          </Link>
        </Button>
      ) : null}
    </main>
  )
}
