import Link from 'next/link'

interface PageProps { params: Promise<{ churchId: string }> }

const cards = [
  { title: 'Templates', href: '/dashboard/communications/templates', desc: 'Reusable SMS and email templates.' },
  { title: 'Campaigns', href: '/dashboard/communications/campaigns', desc: 'Create, schedule, send and monitor campaigns.' },
]

export default async function CommunicationsPage({ params }: PageProps) {
  const { churchId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Communication Hub</h1>
        <p className="text-sm text-muted-foreground">Targeted church communications with delivery visibility.</p>
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
