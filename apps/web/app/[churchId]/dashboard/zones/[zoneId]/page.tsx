'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit2, Trash2, Users, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface Zone {
  id: string
  name: string
  leader?: string
  description?: string
  memberCount?: number
}

export default function ZoneDetailPage() {
  const router = useRouter()
  const params = useParams()
  const churchId = params.churchId as string
  const zoneId = params.zoneId as string

  const [zone, setZone] = useState<Zone | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    async function loadZone() {
      try {
        setLoading(true)
        setError(null)
        // TODO: Implement getZoneById action
        toast.info('Zone detail page coming soon')
        setZone({
          id: zoneId,
          name: 'Zone 1',
          leader: 'John Doe',
          description: 'This is a sample zone',
          memberCount: 15,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load zone'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (zoneId) {
      loadZone()
    }
  }, [zoneId])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // TODO: Implement deleteZone action
      toast.success('Zone deleted successfully')
      router.push(`/${churchId}/dashboard/zones`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete zone'
      toast.error(errorMessage)
      setShowDeleteDialog(false)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="text-lg text-gray-600">Loading zone details...</div>
      </div>
    )
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
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
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
              {zone.leader && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Zone Leader</p>
                  <p className="mt-2 text-lg font-semibold">{zone.leader}</p>
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
                {zone.memberCount || 0} members assigned to this zone
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

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Zone</CardTitle>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete {zone.name}?
                This action cannot be undone.
              </p>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
