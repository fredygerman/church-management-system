import { Suspense } from "react"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { createServiceType, getServiceTypes } from "@/actions/attendance"

import { Button } from "@/components/ui/button"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function ServiceTypesLoading() {
  return <div className="bg-muted/30 h-48 animate-pulse rounded-md border" />
}

async function ServiceTypesContent({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  try {
    const serviceTypes = (await getServiceTypes(churchId)) as any[]

    async function createAction(formData: FormData) {
      "use server"
      const name = String(formData.get("name") || "")
      if (!name.trim()) return
      await createServiceType({ churchId, name: name.trim(), isActive: true })
      revalidatePath(`/${churchId}/dashboard/attendance/service-types`)
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("staff.serviceTypes.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("staff.serviceTypes.description")}
          </p>
        </div>
        <form action={createAction} className="flex max-w-xl gap-2">
          <input
            name="name"
            placeholder={t("staff.serviceTypes.namePlaceholder")}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          >
            {t("staff.serviceTypes.add")}
          </button>
        </form>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">{t("staff.common.name")}</th>
                <th className="px-3 py-2 text-left">{t("staff.serviceTypes.active")}</th>
                <th className="px-3 py-2 text-left">{t("staff.serviceTypes.created")}</th>
              </tr>
            </thead>
            <tbody>
              {serviceTypes.map((type) => (
                <tr key={type.id} className="border-t">
                  <td className="px-3 py-2">{type.name}</td>
                  <td className="px-3 py-2">{type.isActive ? t("staff.common.yes") : t("staff.common.no")}</td>
                  <td className="px-3 py-2">{type.createdAt || "-"}</td>
                </tr>
              ))}
              {serviceTypes.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted-foreground px-3 py-4">
                    {t("staff.serviceTypes.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT"))
      throw error
    const message =
      error instanceof Error
        ? error.message
        : t("staff.serviceTypes.loadError")
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("staff.serviceTypes.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("staff.serviceTypes.description")}
          </p>
        </div>
        <div
          className="border-destructive/50 rounded-md border p-5"
          role="alert"
        >
          <p className="text-destructive text-sm">{message}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/dashboard/attendance/service-types`}>
              {t("staff.common.retry")}
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function AttendanceServiceTypesPage({
  params,
}: PageProps) {
  const { churchId } = await params
  return (
    <Suspense fallback={<ServiceTypesLoading />}>
      <ServiceTypesContent churchId={churchId} />
    </Suspense>
  )
}
