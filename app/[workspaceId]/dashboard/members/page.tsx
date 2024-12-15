import React from "react"
import { getMembers } from "@/actions/member"

import { membersSearchParamsCache } from "@/lib/validators"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { MemberTable } from "@/components/member/table/member-table"
import { MembersTableProvider } from "@/components/member/table/member-table-provider"

export interface SearchParams {
  [key: string]: string | string[] | undefined
}

interface PageProps {
  params: {
    workspaceId: string
  }
  searchParams: Promise<SearchParams>
}

export default async function MembersPage(props: PageProps) {
  const { workspaceId } = props.params
  const searchParams = await props.searchParams
  const queryParams = membersSearchParamsCache.parse(searchParams)
  console.log("goodQueryParams", queryParams)
  const memberPromise = getMembers(queryParams, workspaceId)

  return (
    <div className="flex min-h-screen w-full flex-col px-2 py-2">
      <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
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
              <MemberTable memberPromise={memberPromise} />
            </React.Suspense>
          </MembersTableProvider>
        </div>
      </main>
    </div>
  )
}
