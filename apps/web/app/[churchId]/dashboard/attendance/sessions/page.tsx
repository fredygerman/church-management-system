import { Suspense } from "react"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import {
  createServiceSession,
  getServiceSessions,
  getServiceTypes,
  updateServiceSessionStatus,
  upsertHeadcount,
} from "@/actions/attendance"

import { Button } from "@/components/ui/button"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function SessionsLoading() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/30 h-24 animate-pulse rounded-md border" />
      <div className="bg-muted/30 h-40 animate-pulse rounded-md border" />
    </div>
  )
}

async function SessionsContent({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  const [serviceTypesResult, sessionsResult] = await Promise.allSettled([
    getServiceTypes(churchId),
    getServiceSessions(churchId),
  ])
  const serviceTypes =
    serviceTypesResult.status === "fulfilled"
      ? (serviceTypesResult.value as any[])
      : null
  const sessions =
    sessionsResult.status === "fulfilled"
      ? (sessionsResult.value as any[])
      : null
  const serviceTypesError =
    serviceTypesResult.status === "rejected" ? serviceTypesResult.reason : null
  const sessionsError =
    sessionsResult.status === "rejected" ? sessionsResult.reason : null
  const getMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback
  const statusLabels: Record<string, string> = {
    draft: t("staff.sessions.status.draft"),
    open: t("staff.sessions.status.open"),
    closed: t("staff.sessions.status.closed"),
  }

  for (const error of [serviceTypesError, sessionsError]) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT"))
      throw error
  }

  async function createSessionAction(formData: FormData) {
    "use server"
    const serviceTypeId = String(formData.get("serviceTypeId") || "")
    const sessionDate = String(formData.get("sessionDate") || "")
    const title = String(formData.get("title") || "")
    if (!serviceTypeId || !sessionDate) return
    await createServiceSession({ churchId, serviceTypeId, sessionDate, title })
    revalidatePath(`/${churchId}/dashboard/attendance/sessions`)
  }

  async function statusAction(formData: FormData) {
    "use server"
    const id = String(formData.get("id") || "")
    const status = String(formData.get("status") || "") as
      | "draft"
      | "open"
      | "closed"
    if (!id || !status) return
    await updateServiceSessionStatus({ churchId, id, status })
    revalidatePath(`/${churchId}/dashboard/attendance/sessions`)
  }

  async function headcountAction(formData: FormData) {
    "use server"
    const sessionId = String(formData.get("sessionId") || "")
    if (!sessionId) return
    await upsertHeadcount({
      churchId,
      sessionId,
      menCount: Number(formData.get("menCount") || 0),
      womenCount: Number(formData.get("womenCount") || 0),
      childrenCount: Number(formData.get("childrenCount") || 0),
      visitorsCount: Number(formData.get("visitorsCount") || 0),
    })
    revalidatePath(`/${churchId}/dashboard/attendance/sessions`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("staff.sessions.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("staff.sessions.description")}
        </p>
      </div>
      {serviceTypesError ? (
        <div
          className="border-destructive/50 rounded-md border p-5"
          role="alert"
        >
          <p className="text-destructive text-sm">
            {getMessage(serviceTypesError, t("staff.sessions.typeUnavailable"))}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/dashboard/attendance/sessions`}>
              {t("staff.common.retry")}
            </Link>
          </Button>
        </div>
      ) : (
        <form
          action={createSessionAction}
          className="grid gap-2 rounded-md border p-4 md:grid-cols-4"
        >
          <select
            name="serviceTypeId"
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="">{t("staff.sessions.selectType")}</option>
            {serviceTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <input
            name="title"
            placeholder={t("staff.sessions.titlePlaceholder")}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="sessionDate"
            type="date"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          >
            {t("staff.sessions.create")}
          </button>
        </form>
      )}
      <div className="space-y-4">
        {sessionsError ? (
          <div
            className="border-destructive/50 rounded-md border p-5"
            role="alert"
          >
            <p className="text-destructive text-sm">
              {getMessage(sessionsError, t("staff.sessions.unavailable"))}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/${churchId}/dashboard/attendance/sessions`}>
                {t("staff.common.retry")}
              </Link>
            </Button>
          </div>
        ) : (
          sessions?.map((session) => (
            <div key={session.id} className="rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {session.title ||
                      session.serviceType?.name ||
                      t("staff.sessions.fallbackName")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("staff.sessions.meta", {
                      date: session.sessionDate,
                      status: statusLabels[session.status] ?? session.status,
                      qr: session.qrToken,
                    })}
                  </p>
                </div>
                <form action={statusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={session.id} />
                  <select
                    name="status"
                    defaultValue={session.status}
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="draft">{t("staff.sessions.status.draft")}</option>
                    <option value="open">{t("staff.sessions.status.open")}</option>
                    <option value="closed">{t("staff.sessions.status.closed")}</option>
                  </select>
                  <button
                    className="rounded-md border px-3 py-1 text-sm"
                    type="submit"
                  >
                    {t("staff.sessions.update")}
                  </button>
                </form>
              </div>
              <form
                action={headcountAction}
                className="mt-3 grid gap-2 md:grid-cols-6"
              >
                <input type="hidden" name="sessionId" value={session.id} />
                <input
                  name="menCount"
                  type="number"
                  min={0}
                  placeholder={t("staff.sessions.men")}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <input
                  name="womenCount"
                  type="number"
                  min={0}
                  placeholder={t("staff.sessions.women")}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <input
                  name="childrenCount"
                  type="number"
                  min={0}
                  placeholder={t("staff.sessions.children")}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <input
                  name="visitorsCount"
                  type="number"
                  min={0}
                  placeholder={t("staff.sessions.visitors")}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  {t("staff.sessions.saveHeadcount")}
                </button>
              </form>
            </div>
          ))
        )}
        {!sessionsError && sessions?.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {t("staff.sessions.empty")}
          </p>
        )}
      </div>
    </div>
  )
}

export default async function AttendanceSessionsPage({ params }: PageProps) {
  const { churchId } = await params
  return (
    <Suspense fallback={<SessionsLoading />}>
      <SessionsContent churchId={churchId} />
    </Suspense>
  )
}
