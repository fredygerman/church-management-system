import { getZones } from '@/actions/zone'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: {
    churchId: string
  }
}

export default async function ZonesPage({ params }: PageProps) {
  const { churchId } = params
  let zones = []
  
  try {
    zones = await getZones()
  } catch (error) {
    console.error('Failed to fetch zones:', error)
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-2">
      <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex auto-rows-max items-end justify-between gap-4 md:gap-8 lg:col-span-2">
          <h1 className="text-3xl font-bold">Zones</h1>
          <Link href={`/${churchId}/dashboard/zones/add`}>
            <Button className="rounded bg-blue-500 px-4 py-2 text-white">
              Add Zone
            </Button>
          </Link>
        </div>

        {zones.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No zones found. Create your first zone to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone: any) => (
              <Link 
                key={zone.id}
                href={`/${churchId}/dashboard/zones/${zone.id}`}
              >
                <div className="rounded-lg border bg-card p-4 hover:bg-accent cursor-pointer transition">
                  <h3 className="text-lg font-semibold">{zone.name}</h3>
                  <p className="text-sm text-muted-foreground">{zone.description || 'No description'}</p>
                  <p className="mt-2 text-sm font-medium">Members: {zone.memberCount || 0}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
