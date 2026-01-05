import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getZoneById } from '@/actions/zone'
import { ZoneEditForm } from '@/components/zone/zone-edit-form'
import type { Zone } from '@church/db'

interface ZoneEditPageProps {
  params: {
    churchId: string
    zoneId: string
  }
}

export default async function ZoneEditPage({ params }: ZoneEditPageProps) {
  const { churchId, zoneId } = params
  let zone: Zone | null = null
  let error: string | null = null

  try {
    zone = await getZoneById(zoneId)
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load zone'
  }

  if (error || !zone) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/zones/${zoneId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error || 'Zone not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/zones/${zoneId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Zone</h1>
          <p className="text-gray-600">{zone.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <ZoneEditForm zone={zone} churchId={churchId} />
      </div>
    </div>
  )
}
