import Link from "next/link"
import { getGivingGoalById, getGivingGoalOfferings } from "@/actions/giving-goal"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { formatMoney } from "@/lib/utils"
import type { Translate } from "@church/config"

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

function goalStatusLabel(t: Translate, status: string): string {
  if (status === "upcoming") return t("staff.giving.goals.statusUpcoming")
  if (status === "active") return t("staff.giving.goals.statusActive")
  if (status === "ended") return t("staff.giving.goals.statusEnded")
  return status
}

export default async function GivingGoalDetailPage({ params }: PageProps) {
  await ensurePermission("manage:giving-goals")
  const t = await getTranslator()
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
              {t("staff.giving.goals.title")}
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{goal.name}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{goal.description || t("staff.giving.goals.noDescription")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/offerings/goals/${id}/edit`}>
            <Button variant="outline">{t("staff.giving.goals.edit")}</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("staff.giving.goals.raised")}</p>
          <p className="text-lg font-semibold">{formatMoney(raisedCents, goal.currency)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("staff.giving.goals.target")}</p>
          <p className="text-lg font-semibold">{formatMoney(goal.targetCents, goal.currency)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("staff.giving.goals.progress")}</p>
          <p className="text-lg font-semibold">{percent}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("staff.giving.goals.status")}</p>
          <div className="flex items-center gap-2">
            <Badge>{goalStatusLabel(t, goal.status)}</Badge>
            <Badge variant={goal.isPublic ? "default" : "outline"}>
              {goal.isPublic ? t("staff.giving.public") : t("staff.giving.private")}
            </Badge>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold text-foreground">{t("staff.giving.goals.donorWall")}</h3>
        {donorWallNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("staff.giving.goals.noDonors")}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("staff.giving.goals.givenBy", { names: donorWallNames.join(", ") })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t("staff.giving.goals.linkedOfferings")}</h3>
        {offerings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("staff.giving.goals.noLinkedOfferings")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("staff.offerings.table.date")}</TableHead>
                <TableHead>{t("staff.offerings.table.member")}</TableHead>
                <TableHead className="text-right">{t("staff.offerings.table.amount")}</TableHead>
                <TableHead>{t("staff.giving.goals.donorWall")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offerings.map((offering) => (
                <TableRow key={offering.id}>
                  <TableCell>{formatDate(offering.offeringDate)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {offering.memberName ?? t("staff.offerings.anonymous")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(offering.amountCents, offering.currency)}
                  </TableCell>
                  <TableCell>{offering.showOnDonorWall ? t("staff.common.yes") : t("staff.common.no")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
