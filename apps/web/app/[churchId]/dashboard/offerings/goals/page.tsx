import React from "react"
import Link from "next/link"
import { getGivingGoals } from "@/actions/giving-goal"
import { ensurePermission } from "@/lib/permissions-server"
import { formatMoney } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "active") return "default"
  if (status === "upcoming") return "secondary"
  return "outline"
}

async function GoalsTable({
  goalsPromise,
  churchId,
}: {
  goalsPromise: ReturnType<typeof getGivingGoals>
  churchId: string
}) {
  const goals = await goalsPromise

  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No giving goals yet. Create one to start a fundraising campaign.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Raised of Target</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goals.map((goal) => {
          const percent =
            goal.targetCents > 0 ? Math.round(((goal.raisedCents ?? 0) / goal.targetCents) * 100) : 0
          return (
            <TableRow key={goal.id}>
              <TableCell className="font-medium">
                <Link href={`/${churchId}/dashboard/offerings/goals/${goal.id}`} className="hover:underline">
                  {goal.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatMoney(goal.raisedCents ?? 0, goal.currency)} of {formatMoney(goal.targetCents, goal.currency)}
              </TableCell>
              <TableCell>{percent}%</TableCell>
              <TableCell>
                <Badge variant={statusVariant(goal.status)}>{goal.status}</Badge>
                {goal.targetReached && (
                  <Badge variant="secondary" className="ml-2">
                    Target reached
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={goal.isPublic ? "default" : "outline"}>
                  {goal.isPublic ? "Public" : "Private"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/${churchId}/dashboard/offerings/goals/${goal.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default async function GivingGoalsPage({ params }: PageProps) {
  await ensurePermission("manage:giving-goals")
  const { churchId } = await params
  const goalsPromise = getGivingGoals(churchId)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Giving Goals</h2>
          <p className="text-muted-foreground">Manage fundraising goals and track progress.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/offerings`}>
            <Button variant="outline">Back to Offerings</Button>
          </Link>
          <Link href={`/${churchId}/dashboard/offerings/goals/add`}>
            <Button>Add Goal</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <React.Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <GoalsTable goalsPromise={goalsPromise} churchId={churchId} />
      </React.Suspense>
    </div>
  )
}
