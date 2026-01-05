import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ZoneCreateForm } from '@/components/zone/zone-create-form'

interface ZoneAddPageProps {
  params: {
    churchId: string
  }
}

export default async function ZoneAddPage({ params }: ZoneAddPageProps) {
  const { churchId } = params

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/zones`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Zone</h1>
          <p className="text-gray-600">Add a new zone to your church</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <ZoneCreateForm churchId={churchId} />
      </div>
    </div>
  )
}

