import React from "react"
import Link from "next/link"
import { getZoneById, getZoneMembers, getZoneLeader } from "@/actions/zone"

import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { ZoneMembersTable } from "@/components/zone/table/zone-members-table"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddMemberDialogClient } from "@/components/zone/add-member-dialog-client"

interface PageProps {
  params: Promise<{
    churchId: string
    id: string
  }>
}

export default async function ZoneDetailPage({ params }: PageProps) {
  const { churchId, id: zoneId } = await params
  
  const zonePromise = getZoneById(zoneId)
  const membersPromise = getZoneMembers(zoneId)

  const zone = await zonePromise
  
  // Fetch leader details if leaderId exists
  let leader = null
  if (zone.leaderId) {
    leader = await getZoneLeader(zone.leaderId)
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/${churchId}/dashboard/zones`} className="text-blue-600 hover:underline">
              Zones
            </Link>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{zone.name}</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            View zone details and manage zone members.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${churchId}/dashboard/zones/${zoneId}/edit`}>
            <Button variant="outline">Edit Zone</Button>
          </Link>
        </div>
      </div>
      <Separator />

      {/* Zone Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Zone Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zone.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Meeting Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {zone.meetingDay || "Not Set"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Leader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leader ? `${leader.firstName} ${leader.lastName}` : "Not Assigned"}
            </div>
          </CardContent>
        </Card>
      </div>

      {zone.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{zone.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Zone Members Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Zone Members</h3>
          <p className="text-muted-foreground text-sm">
            Manage members assigned to this zone.
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
