import { getPublicGivingGoals } from "@/actions/giving-goal"
import { formatMoney } from "@/lib/utils"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function PortalGivingGoalsPage({ params }: PageProps) {
  const { churchId } = await params
  const goals = await getPublicGivingGoals(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Giving Goals</h1>
        <p className="text-sm text-muted-foreground">Church fundraising goals and how much has been raised.</p>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">There are no active giving goals right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const raisedCents = goal.raisedCents ?? 0
            const percent = goal.targetCents > 0 ? Math.round((raisedCents / goal.targetCents) * 100) : 0
            const barWidth = Math.min(percent, 100)
            const donorWallNames: string[] = Array.isArray(goal.donorWallNames) ? goal.donorWallNames : []

            return (
              <div key={goal.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
                <div>
                  <h2 className="text-lg font-medium text-foreground">{goal.name}</h2>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatMoney(raisedCents, goal.currency)} of {formatMoney(goal.targetCents, goal.currency)}
                    </span>
                    <span className="font-semibold text-foreground">{percent}%</span>
                  </div>
                </div>

                {donorWallNames.length > 0 && (
                  <p className="text-xs text-muted-foreground">Given by: {donorWallNames.join(", ")}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
