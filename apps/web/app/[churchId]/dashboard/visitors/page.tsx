import React from "react"
import Link from "next/link"
import { getVisitors } from "@/actions/visitor"
import { checkPermission, ensurePermission } from "@/lib/permissions-server"

import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { VisitorTable } from "@/components/visitor/table/visitor-table"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function VisitorsPage(props: PageProps) {
  await ensurePermission('view:visitors')
  const { churchId } = await props.params
  const visitorPromise = getVisitors(churchId)
  const canCreateVisitor = await checkPermission('create:visitor')
  const canConvertVisitor = await checkPermission('convert:visitor')

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visitors</h2>
          <p className="text-muted-foreground">
            Manage and track visitor information and follow-ups.
          </p>
        </div>
        {canCreateVisitor && (
          <div className="flex items-center gap-4">
            <Link href={`/${churchId}/dashboard/visitors/add`}>
              <Button>Add Visitor</Button>
            </Link>
          </div>
        )}
      </div>
      <Separator />

      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={6}
            searchableColumnCount={2}
            filterableColumnCount={1}
            cellWidths={["10rem", "40rem", "12rem", "12rem", "12rem", "8rem"]}
            shrinkZero
          />
        }
      >
        <VisitorTable visitorPromise={visitorPromise} churchId={churchId} canConvert={canConvertVisitor} />
      </React.Suspense>
    </div>
  )
}
