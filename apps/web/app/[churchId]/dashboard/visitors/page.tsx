import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getVisitors } from '@/actions/visitor'

interface PageProps {
  params: {
    churchId: string
  }
}

export default async function VisitorsPage({ params }: PageProps) {
  const { churchId } = params
  const visitors = await getVisitors(churchId)

  return (
    <div className="flex min-h-screen w-full flex-col p-2">
      <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex auto-rows-max items-end justify-between gap-4 md:gap-8 lg:col-span-2">
          <h1 className="text-3xl font-bold">Visitors</h1>
          <Link href={`/${churchId}/dashboard/visitors/add`}>
            <Button className="rounded bg-blue-500 px-4 py-2 text-white">
              Add Visitor
            </Button>
          </Link>
        </div>

        {visitors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No visitors found. Add your first visitor to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitors.map((visitor: any) => (
              <div 
                key={visitor.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{visitor.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{visitor.phone || 'No phone'}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Status:</span>{' '}
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        {visitor.status || 'Pending'}
                      </span>
                    </p>
                  </div>
                  <Link href={`/${churchId}/dashboard/visitors/${visitor.id}`}>
                    <Button variant="outline" size="sm">
                      Follow up
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
