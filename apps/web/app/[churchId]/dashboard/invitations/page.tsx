import { getTranslator } from "@/lib/i18n/server"
import { checkPermission } from "@/lib/permissions-server"
import { listInvitations, listPendingRequests } from "@/components/invitations/actions"
import { InvitationsManager } from "@/components/invitations/invitations-manager"
import { Card, CardContent } from "@/components/ui/card"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function InvitationsPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()

  // Checked here, before any API call, so users without the permission never load the lists.
  if (!(await checkPermission("manage:invitations"))) {
    return (
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-semibold">{t("invitations.title")}</h1>
        <Card>
          <CardContent className="pt-6">
            <p role="alert" className="text-sm text-muted-foreground">
              {t("invitations.error.noPermission")}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [codes, requests] = await Promise.all([listInvitations(churchId), listPendingRequests(churchId)])

  return <InvitationsManager churchId={churchId} initialCodes={codes} initialRequests={requests} />
}
