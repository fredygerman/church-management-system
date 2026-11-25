import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DepartmentCreateForm } from '@/components/department/department-create-form'
import { getTranslator } from '@/lib/i18n/server'

interface DepartmentAddPageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function DepartmentAddPage({ params }: DepartmentAddPageProps) {
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/departments`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("staff.groups.back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("staff.departments.createTitle")}</h1>
          <p className="text-gray-600">{t("staff.departments.createDescription")}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DepartmentCreateForm churchId={churchId} />
      </div>
    </div>
  )
}
