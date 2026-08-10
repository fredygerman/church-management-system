import Link from "next/link"
import { getGivingGoalById, getGivingGoalOfferings } from "@/actions/giving-goal"
import { ensurePermission } from "@/lib/permissions-server"
import { formatMoney } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString()
}

export default async function GivingGoalDetailPage({ params }: PageProps) {
  await ensurePermission("manage:giving-goals")
  const { churchId, id } = await params

  const [goal, offerings] = await Promise.all([
    getGivingGoalById(churchId, id),
    getGivingGoalOfferings(churchId, id),
  ])

  const raisedCents = goal.raisedCents ?? 0
  const percent = goal.targetCents > 0 ? Math.round((raisedCents / goal.targetCents) * 100) : 0
  const donorWallNames: string[] = Array.isArray(goal.donorWallNames) ? goal.donorWallNames : []

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/offerings/goals`} className="text-blue-600 hover:underline">
              Giving Goals
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{goal.name}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{goal.description || "No description"}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/offerings/goals/${id}/edit`}>
            <Button variant="outline">Edit Goal</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Raised</p>
          <p className="text-lg font-semibold">{formatMoney(raisedCents, goal.currency)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Target</p>
          <p className="text-lg font-semibold">{formatMoney(goal.targetCents, goal.currency)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Progress</p>
          <p className="text-lg font-semibold">{percent}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="flex items-center gap-2">
            <Badge>{goal.status}</Badge>
            <Badge variant={goal.isPublic ? "default" : "outline"}>{goal.isPublic ? "Public" : "Private"}</Badge>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Donor Wall</h3>
        {donorWallNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one has opted in to public recognition yet.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Given by: {donorWallNames.join(", ")}</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Linked Offerings</h3>
        {offerings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No offerings have been linked to this goal yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Donor Wall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offerings.map((offering) => (
                <TableRow key={offering.id}>
                  <TableCell>{formatDate(offering.offeringDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{offering.memberName ?? "Anonymous"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(offering.amountCents, offering.currency)}
                  </TableCell>
                  <TableCell>{offering.showOnDonorWall ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
