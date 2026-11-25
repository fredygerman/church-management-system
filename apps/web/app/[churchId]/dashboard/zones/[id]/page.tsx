import React from "react"
import Link from "next/link"
import { getZoneById, getZoneMembers, getZoneLeader, getZoneStats } from "@/actions/zone"

import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { ZoneMembersTable } from "@/components/zone/table/zone-members-table"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddMemberDialogClient } from "@/components/zone/add-member-dialog-client"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{
    churchId: string
    id: string
  }>
}

export default async function ZoneDetailPage({ params }: PageProps) {
  const { churchId, id: zoneId } = await params
  
  const zonePromise = getZoneById(churchId, zoneId)
  const membersPromise = getZoneMembers(churchId, zoneId)

  const zone = await zonePromise
  const { members: zoneMembers = [] } = await membersPromise
  
  // Fetch leader details if leaderId exists
  let leader = null
  if (zone.leaderId) {
    leader = await getZoneLeader(churchId, zone.leaderId)
  }

  // Fetch zone statistics
  const stats = await getZoneStats(churchId, zoneId)
  const t = await getTranslator()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{zone.name}</h2>
          <p className="text-muted-foreground mt-1">
            {t("staff.zones.detailDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${churchId}/dashboard/zones/${zoneId}/edit`}>
            <Button variant="outline">{t("staff.zones.edit")}</Button>
          </Link>
        </div>
      </div>
      <Separator />

      {/* Zone Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("staff.zones.name")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zone.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("staff.groups.meetingDay")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {zone.meetingDay || t("staff.groups.notSet")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("staff.groups.leaderLabel")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leader ? `${leader.firstName} ${leader.lastName}` : t("staff.groups.notAssigned")}
            </div>
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

      {zone.description && (
        <Card>
          <CardHeader>
            <CardTitle>{t("staff.groups.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{zone.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Zone Members Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t("staff.zones.membersTitle")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("staff.zones.membersDescription")}
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
              <AddMemberDialogClient churchId={churchId} zoneId={zoneId} />
            </div>
            <ZoneMembersTable membersPromise={membersPromise} churchId={churchId} zoneId={zoneId} zone={zone} />
          </div>
        </React.Suspense>
      </div>
    </div>
  )
}
