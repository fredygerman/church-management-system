import Link from "next/link"
import { translatorFor, formatLocaleDate } from "@church/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listAnnouncements } from "@/components/announcements-editor/actions"
import { STATUS_KEYS, announcementErrorKey } from "@/components/announcements-editor/rules"
import { getLocale } from "@/lib/i18n/server"
import { checkPermission, ensurePermission } from "@/lib/permissions-server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AnnouncementsPage({ params }: PageProps) {
  await ensurePermission("view:announcements")
  const { churchId } = await params
  const locale = await getLocale()
  const t = translatorFor(locale)
  const [canPublish, result] = await Promise.all([
    checkPermission("publish:announcements"),
    listAnnouncements(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("announcements.list.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("announcements.list.description")}</p>
        </div>
        {canPublish ? (
          <Button asChild>
            <Link href={`/${churchId}/dashboard/announcements/new`}>{t("announcements.list.new")}</Link>
          </Button>
        ) : null}
      </div>

      {!result.ok ? (
        <p role="alert" className="text-destructive text-sm">
          {t(announcementErrorKey(result.code, "loadFailed"))}
        </p>
      ) : result.data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("announcements.list.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">{t("announcements.list.column.title")}</th>
                <th scope="col" className="px-4 py-2 font-medium">{t("announcements.list.column.status")}</th>
                <th scope="col" className="px-4 py-2 font-medium">{t("announcements.list.column.date")}</th>
                <th scope="col" className="px-4 py-2">
                  <span className="sr-only">{t("announcements.list.open")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.data.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{t(STATUS_KEYS[item.status] ?? STATUS_KEYS.draft)}</Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {formatLocaleDate(item.publishedAt ?? item.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/${churchId}/dashboard/announcements/${item.id}`}>{t("announcements.list.open")}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
