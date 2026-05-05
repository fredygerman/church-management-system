import Link from 'next/link'

interface PageProps {
  params: Promise<{ churchId: string }>
}

const cards = [
  { title: 'Service Types', href: '/dashboard/attendance/service-types', desc: 'Define reusable Sunday/Midweek service templates.' },
  { title: 'Sessions', href: '/dashboard/attendance/sessions', desc: 'Create, open and close service sessions.' },
  { title: 'Check-In', href: '/dashboard/attendance/check-in', desc: 'Manual and QR member check-in for open sessions.' },
  { title: 'Analytics', href: '/dashboard/attendance/analytics', desc: 'Attendance trend slices by date and demographics.' },
  { title: 'At-Risk Queue', href: '/dashboard/attendance/at-risk', desc: 'Members with consecutive missed services.' },
  { title: 'Risk Settings', href: '/dashboard/attendance/risk-settings', desc: 'Configure church-specific at-risk threshold override.' },
]

export default async function AttendancePage({ params }: PageProps) {
  const { churchId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance & Service Intelligence</h1>
        <p className="text-sm text-muted-foreground">Operational tools for service-day check-in and engagement visibility.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.title} href={`/${churchId}${card.href}`} className="rounded-lg border p-4 hover:bg-muted/40">
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
