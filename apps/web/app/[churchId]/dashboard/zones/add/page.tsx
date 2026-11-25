import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ZoneCreateForm } from '@/components/zone/zone-create-form'
import { getTranslator } from '@/lib/i18n/server'

interface ZoneAddPageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function ZoneAddPage({ params }: ZoneAddPageProps) {
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/zones`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("staff.groups.back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("staff.zones.createTitle")}</h1>
          <p className="text-gray-600">{t("staff.zones.createDescription")}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <ZoneCreateForm churchId={churchId} />
      </div>
    </div>
  )
}

