import React from "react"
import Link from "next/link"
import { getDepartments } from "@/actions/department"

import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DepartmentTable } from "@/components/department/table/department-table"
import { DepartmentsTableProvider } from "@/components/department/table/department-table-provider"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function DepartmentsPage({ params }: PageProps) {
  const { churchId } = await params
  const departmentsPromise = getDepartments(churchId)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">
            Manage and monitor your church departments.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/departments/add`}>
            <Button>Add Department</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <DepartmentsTableProvider>
        <React.Suspense
          fallback={
            <DataTableSkeleton
              columnCount={3}
              searchableColumnCount={2}
              filterableColumnCount={1}
              cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem"]}
              shrinkZero
            />
          }
        >
          <DepartmentTable departmentsPromise={departmentsPromise} churchId={churchId} />
        </React.Suspense>
      </DepartmentsTableProvider>
    </div>
  )
}
