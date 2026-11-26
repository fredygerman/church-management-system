import type { MessageKey } from "@church/config"
import Link from "next/link"

import { getLibraryResource, getLibraryResourceProgress } from "@/actions/library-resources"
import { Button } from "@/components/ui/button"
import { getTranslator } from "@/lib/i18n/server"
import { ResourceActions } from "./resource-actions"

interface PageProps {
  params: Promise<{ churchId: string; resourceId: string }>
}

export default async function PortalLibraryResourcePage({ params }: PageProps) {
  const { churchId, resourceId } = await params
  const t = await getTranslator()
  const resource = await getLibraryResource(churchId, resourceId)
  const back = `/${churchId}/portal/library/resources`

  if (resource.status === "unavailable") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">{t("wiring.library.resource.notFound")}</p>
        <Button asChild variant="outline">
          <Link href={back}>{t("wiring.library.resource.back")}</Link>
        </Button>
      </div>
    )
  }

  const progress = await getLibraryResourceProgress(churchId, resourceId)
  const data = resource.data
  const isMedia = data.resourceType === "audio" || data.resourceType === "video"

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="px-0">
        <Link href={back}>{t("wiring.library.resource.back")}</Link>
      </Button>
      <p className="text-muted-foreground text-xs">
        {t("wiring.library.resource.type")}: {t(`wiring.library.type.${data.resourceType}` as MessageKey)}
      </p>
      <h1 className="text-foreground text-2xl font-semibold">{data.title}</h1>
      {data.authorSpeaker ? (
        <p className="text-muted-foreground text-sm">{t("wiring.library.resource.author", { name: data.authorSpeaker })}</p>
      ) : null}
      {data.description ? <p className="text-foreground whitespace-pre-wrap text-sm">{data.description}</p> : null}

      <ResourceActions
        churchId={churchId}
        resourceId={data.id}
        isMedia={isMedia}
        initialPositionSeconds={progress.status === "ok" ? progress.data.positionSeconds : 0}
        initialPageNumber={progress.status === "ok" ? progress.data.pageNumber : null}
      />
    </div>
  )
}
