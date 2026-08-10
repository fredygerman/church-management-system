import { getMyOfferings } from "@/actions/offering"
import { formatMoney } from "@/lib/utils"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString()
}

// The self-service response may or may not join the category name - fall
// back to the raw categoryId rather than crash if it doesn't.
function categoryLabel(offering: any): string {
  return offering.category?.name || offering.categoryName || offering.categoryId || "—"
}

export default async function PortalOfferingsPage({ params }: PageProps) {
  const { churchId } = await params
  const offerings = await getMyOfferings(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Giving History</h1>
        <p className="text-sm text-muted-foreground">A record of your own named contributions.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        {offerings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any recorded giving history yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {offerings.map((offering) => (
              <li
                key={offering.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{categoryLabel(offering)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(offering.offeringDate)}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatMoney(offering.amountCents, offering.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
