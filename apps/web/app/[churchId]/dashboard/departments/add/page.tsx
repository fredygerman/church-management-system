import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DepartmentCreateForm } from '@/components/department/department-create-form'

interface DepartmentAddPageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function DepartmentAddPage({ params }: DepartmentAddPageProps) {
  const { churchId } = await params

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/departments`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Department</h1>
          <p className="text-gray-600">Add a new department to your church</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DepartmentCreateForm churchId={churchId} />
      </div>
    </div>
  )
}
