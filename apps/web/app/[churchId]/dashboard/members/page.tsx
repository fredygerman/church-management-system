import React from "react"
import Link from "next/link"
import { getMembers } from "@/actions/member"

import { membersSearchParamsCache } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { MemberTable } from "@/components/member/table/member-table"
import { MembersTableProvider } from "@/components/member/table/member-table-provider"
import { Separator } from "@/components/ui/separator"

export interface SearchParams {
  [key: string]: string | string[] | undefined
}

interface PageProps {
  params: Promise<{
    churchId: string
  }>
  searchParams: Promise<SearchParams>
}

export default async function MembersPage(props: PageProps) {
  const { churchId } = await props.params
  const searchParams = await props.searchParams
  const queryParams = membersSearchParamsCache.parse(searchParams)
  const memberPromise = getMembers(queryParams, churchId)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage and monitor your church members.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/members/add`}>
            <Button>Add Member</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <MembersTableProvider>
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
          <MemberTable memberPromise={memberPromise} churchId={churchId} />
        </React.Suspense>
      </MembersTableProvider>
    </div>
  )
}
