import React from "react"
import Link from "next/link"
import { getMembers } from "@/actions/member"

import { checkPermission, ensurePermission } from "@/lib/permissions-server"
import { membersSearchParamsCache } from "@/lib/validators"
import { getTranslator } from "@/lib/i18n/server"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { MemberTable } from "@/components/member/table/member-table"
import { MembersTableProvider } from "@/components/member/table/member-table-provider"

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
  await ensurePermission("read:member")
  const { churchId } = await props.params
  const searchParams = await props.searchParams
  const t = await getTranslator()
  const queryParams = membersSearchParamsCache.parse(searchParams)
  const memberPromise = getMembers(queryParams, churchId)
  const canCreateMember = await checkPermission("create:member")

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("staff.members.title")}</h2>
          <p className="text-muted-foreground">
            {t("staff.members.description")}
          </p>
        </div>
        {canCreateMember && (
          <div className="flex items-center gap-4">
            <Link href={`/${churchId}/dashboard/members/add`}>
              <Button>{t("staff.members.add")}</Button>
            </Link>
          </div>
        )}
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
          <MemberTable
            memberPromise={memberPromise}
            churchId={churchId}
            emptyMessage={t("staff.members.empty")}
          />
        </React.Suspense>
      </MembersTableProvider>
    </div>
  )
}
