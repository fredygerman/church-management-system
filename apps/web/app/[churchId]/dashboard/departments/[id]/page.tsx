import React from "react"
import Link from "next/link"
import { getDepartmentById, getDepartmentMembers, getDepartmentStats } from "@/actions/department"

import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DepartmentMembersTable } from "@/components/department/table/department-members-table"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddMemberDialogClient } from "@/components/department/add-member-dialog-client"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{
    churchId: string
    id: string
  }>
}

export default async function DepartmentDetailPage({ params }: PageProps) {
  const { churchId, id: departmentId } = await params

  const departmentPromise = getDepartmentById(churchId, departmentId)
  const membersPromise = getDepartmentMembers(churchId, departmentId)
  const statsPromise = getDepartmentStats(churchId, departmentId)

  const department = await departmentPromise
  const { members: departmentMembers = [] } = await membersPromise
  const stats = await statsPromise

  // Get leaders (members with isLeader = true)
  const leaders = departmentMembers.filter((m) => m.isLeader)
  const t = await getTranslator()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{department.name}</h2>
          <p className="text-muted-foreground mt-1">
            {t("staff.departments.detailDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${churchId}/dashboard/departments/${departmentId}/edit`}>
            <Button variant="outline">{t("staff.departments.edit")}</Button>
          </Link>
        </div>
      </div>
      <Separator />

      {/* Department Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("staff.departments.name")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("staff.groups.meetingDay")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {department.meetingDay || t("staff.groups.notSet")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("staff.groups.leaders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.leaders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("staff.groups.totalMembers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t(stats?.leaders !== 1 ? "staff.groups.leaderCountPlural" : "staff.groups.leaderCount", { count: stats?.leaders || 0 })}
              {" • "}
              {t(stats?.regularMembers !== 1 ? "staff.groups.memberCountPlural" : "staff.groups.memberCount", { count: stats?.regularMembers || 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {department.description && (
        <Card>
          <CardHeader>
            <CardTitle>{t("staff.groups.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{department.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Leaders Section */}
      {leaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("staff.departments.leaders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {leaders.map((leader) => (
                <li key={leader.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <Link
                    href={`/${churchId}/dashboard/members/${leader.id}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {leader.firstName} {leader.lastName}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Department Members Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t("staff.departments.membersTitle")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("staff.departments.membersDescription")}
          </p>
        </div>
        <Separator />

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
          <div>
            <div className="flex items-center justify-between">
              <div />
              <AddMemberDialogClient churchId={churchId} departmentId={departmentId} />
            </div>
            <DepartmentMembersTable
              membersPromise={membersPromise}
              churchId={churchId}
              departmentId={departmentId}
            />
          </div>
        </React.Suspense>
      </div>
    </div>
  )
}
