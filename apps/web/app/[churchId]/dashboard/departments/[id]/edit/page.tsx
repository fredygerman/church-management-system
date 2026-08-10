import React from "react"
import { getDepartmentById } from "@/actions/department"
import { DepartmentForm } from "@/components/form/DepartmentForm"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditDepartmentPage({ params }: PageProps) {
  const { churchId, id } = await params
  const department = await getDepartmentById(churchId, id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/departments`} className="text-blue-600 hover:underline">
              Departments
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">Edit Department</h2>
          </div>
          <p className="text-muted-foreground mt-1">Edit department details</p>
        </div>
      </div>
      <Separator />

      <DepartmentForm churchId={churchId} initialData={department} isEditMode />
    </div>
  )
}
