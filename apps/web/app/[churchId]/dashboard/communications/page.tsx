import Link from 'next/link'
import { getTranslator } from '@/lib/i18n/server'

interface PageProps { params: Promise<{ churchId: string }> }

const cardHrefs = [
  { href: '/dashboard/communications/templates', title: 'staff.communications.hub.templatesTitle', desc: 'staff.communications.hub.templatesDescription' },
  { href: '/dashboard/communications/campaigns', title: 'staff.communications.hub.campaignsTitle', desc: 'staff.communications.hub.campaignsDescription' },
] as const

export default async function CommunicationsPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('staff.communications.hub.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('staff.communications.hub.description')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cardHrefs.map((card) => (
          <Link key={card.href} href={`/${churchId}${card.href}`} className="rounded-lg border p-4 hover:bg-muted/40">
            <h2 className="font-medium">{t(card.title)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t(card.desc)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
