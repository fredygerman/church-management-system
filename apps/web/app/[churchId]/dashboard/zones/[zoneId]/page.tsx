import Link from 'next/link'
import { ArrowLeft, Edit2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getZoneById } from '@/actions/zone'
import type { Zone } from '@church/db'

interface ZoneDetailPageProps {
  params: {
    churchId: string
    zoneId: string
  }
}

export default async function ZoneDetailPage({ params }: ZoneDetailPageProps) {
  const { churchId, zoneId } = params
  let zone: Zone | null = null
  let error: string | null = null

  try {
    zone = await getZoneById(zoneId)
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load zone'
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/zones`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Zones
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!zone) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/zones`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Zones
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-700">Zone not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/zones`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{zone.name}</h1>
            <p className="text-gray-600">Zone Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${churchId}/dashboard/zones/${zoneId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Zone Information */}
          <Card>
            <CardHeader>
              <CardTitle>Zone Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Zone Name</p>
                <p className="mt-2 text-lg font-semibold">{zone.name}</p>
              </div>
              {zone.meetingDay && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Meeting Day</p>
                  <p className="mt-2 text-lg font-semibold">{zone.meetingDay}</p>
                </div>
              )}
              {zone.description && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p className="mt-2 text-gray-700">{zone.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members in Zone */}
          <Card>
            <CardHeader>
              <CardTitle>Members in Zone</CardTitle>
              <CardDescription>
                Members assigned to this zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border border-dashed bg-gray-50 p-12">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">
                    Member list coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/${churchId}/dashboard/members?zone=${zoneId}`}>
                <Button className="w-full" variant="outline">
                  View Members
                </Button>
              </Link>
              <Button className="w-full" variant="outline">
                Add Member
              </Button>
              <Button className="w-full" variant="outline">
                View Statistics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zone ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs text-gray-600 break-all">{zone.id}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
