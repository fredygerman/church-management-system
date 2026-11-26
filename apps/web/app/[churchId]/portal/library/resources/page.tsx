import type { MessageKey } from "@church/config"
import Link from "next/link"

import { listLibraryResources, type LibraryResourceType } from "@/actions/library-resources"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ query?: string; cursor?: string; type?: string }>
}

const RESOURCE_TYPES: LibraryResourceType[] = ["document", "book", "sermon", "audio", "video"]

export default async function PortalLibraryResourcesPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { query, cursor, type } = await searchParams
  const t = await getTranslator()
  const resourceType = RESOURCE_TYPES.find((value) => value === type)
  const result = await listLibraryResources(churchId, {
    query: query?.trim() || undefined,
    cursor: cursor || null,
    resourceType,
  })
  const base = `/${churchId}/portal/library/resources`

  return (
    <div className="space-y-4">
      <h1 className="text-foreground text-2xl font-semibold">{t("wiring.library.resources.title")}</h1>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <Input type="search" name="query" aria-label={t("wiring.library.resources.search")} defaultValue={query ?? ""} />
        <select
          name="type"
          aria-label={t("wiring.library.resource.type")}
          defaultValue={resourceType ?? ""}
          className="border-border bg-card rounded-md border px-3 py-2 text-sm"
        >
          <option value="">{t("wiring.library.resources.title")}</option>
          {RESOURCE_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`wiring.library.type.${value}` as MessageKey)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          {t("wiring.library.resources.search")}
        </Button>
      </form>

      {result.status === "unavailable" ? (
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">{result.message}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={base}>{t("wiring.common.retry")}</Link>
          </Button>
        </div>
      ) : result.data.items.length === 0 ? (
        <div className="border-border bg-card rounded-lg border p-5">
          <p className="text-muted-foreground text-sm">
            {query || resourceType ? t("wiring.library.resources.noMatch") : t("wiring.library.resources.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {result.data.items.map((resource) => (
            <li key={resource.id} className="border-border bg-card rounded-lg border p-5">
              <p className="text-muted-foreground text-xs">{t(`wiring.library.type.${resource.resourceType}` as MessageKey)}</p>
              <h2 className="text-foreground font-medium">{resource.title}</h2>
              {resource.authorSpeaker ? (
                <p className="text-muted-foreground text-sm">{t("wiring.library.resource.author", { name: resource.authorSpeaker })}</p>
              ) : null}
              <Button asChild variant="outline" className="mt-3">
                <Link href={`${base}/${resource.id}`}>{t("wiring.library.resources.open")}</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {result.status === "ok" && result.data.nextCursor ? (
        <Button asChild variant="outline">
          <Link
            href={`${base}?${new URLSearchParams({
              ...(query ? { query } : {}),
              ...(resourceType ? { type: resourceType } : {}),
              cursor: result.data.nextCursor,
            }).toString()}`}
          >
            {t("wiring.library.resources.loadMore")}
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
