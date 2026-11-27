import { AnnouncementEditor } from "@/components/announcements-editor/announcement-editor"
import { getLocale } from "@/lib/i18n/server"
import { ensurePermission } from "@/lib/permissions-server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function NewAnnouncementPage({ params }: PageProps) {
  await ensurePermission("publish:announcements")
  const { churchId } = await params
  const locale = await getLocale()

  return <AnnouncementEditor churchId={churchId} locale={locale} canPublish announcement={null} />
}
