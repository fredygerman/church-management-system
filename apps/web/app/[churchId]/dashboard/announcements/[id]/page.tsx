import { notFound } from "next/navigation"
import { translatorFor } from "@church/config"
import { getAnnouncement } from "@/components/announcements-editor/actions"
import { AnnouncementEditor } from "@/components/announcements-editor/announcement-editor"
import { announcementErrorKey } from "@/components/announcements-editor/rules"
import { getLocale } from "@/lib/i18n/server"
import { checkPermission, ensurePermission } from "@/lib/permissions-server"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function AnnouncementPage({ params }: PageProps) {
  await ensurePermission("view:announcements")
  const { churchId, id } = await params
  const locale = await getLocale()
  const canPublish = await checkPermission("publish:announcements")
  const result = await getAnnouncement(id)

  if (!result.ok) {
    if (result.code === "NOT_FOUND") notFound()
    const t = translatorFor(locale)
    return (
      <p role="alert" className="text-destructive text-sm">
        {t(announcementErrorKey(result.code, "loadFailed"))}
      </p>
    )
  }

  return (
    <AnnouncementEditor
      key={result.data.id}
      churchId={churchId}
      locale={locale}
      canPublish={canPublish}
      announcement={result.data}
    />
  )
}
