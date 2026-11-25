import React from "react"
import Link from "next/link"
import { getGivingGoals } from "@/actions/giving-goal"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { formatMoney } from "@/lib/utils"
import type { Translate } from "@church/config"

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

function goalStatusLabel(t: Translate, status: string): string {
  if (status === "upcoming") return t("staff.giving.goals.statusUpcoming")
  if (status === "active") return t("staff.giving.goals.statusActive")
  if (status === "ended") return t("staff.giving.goals.statusEnded")
  return status
}

async function GoalsTable({
  goalsPromise,
  churchId,
}: {
  goalsPromise: ReturnType<typeof getGivingGoals>
  churchId: string
}) {
  const t = await getTranslator()
  const goals = await goalsPromise

  if (goals.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("staff.giving.goals.empty")}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("staff.common.name")}</TableHead>
          <TableHead>{t("staff.giving.goals.raisedOfTarget")}</TableHead>
          <TableHead>{t("staff.giving.goals.progress")}</TableHead>
          <TableHead>{t("staff.giving.goals.status")}</TableHead>
          <TableHead>{t("staff.giving.goals.visibility")}</TableHead>
          <TableHead className="w-24 text-right">{t("staff.giving.actions")}</TableHead>
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
                {t("staff.giving.goals.raisedOfTargetValue", {
                  raised: formatMoney(goal.raisedCents ?? 0, goal.currency),
                  target: formatMoney(goal.targetCents, goal.currency),
                })}
              </TableCell>
              <TableCell>{percent}%</TableCell>
              <TableCell>
                <Badge variant={statusVariant(goal.status)}>{goalStatusLabel(t, goal.status)}</Badge>
                {goal.targetReached && (
                  <Badge variant="secondary" className="ml-2">
                    {t("staff.giving.goals.targetReached")}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={goal.isPublic ? "default" : "outline"}>
                  {goal.isPublic ? t("staff.giving.public") : t("staff.giving.private")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/${churchId}/dashboard/offerings/goals/${goal.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  {t("staff.giving.edit")}
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
  const t = await getTranslator()
  const { churchId } = await params
  const goalsPromise = getGivingGoals(churchId)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("staff.giving.goals.title")}</h2>
          <p className="text-muted-foreground">{t("staff.giving.goals.description")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/offerings`}>
            <Button variant="outline">{t("staff.giving.backToOfferings")}</Button>
          </Link>
          <Link href={`/${churchId}/dashboard/offerings/goals/add`}>
            <Button>{t("staff.giving.goals.add")}</Button>
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
