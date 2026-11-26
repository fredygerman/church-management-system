import React from "react"
import Link from "next/link"
import { getOfferings, getOfferingCategories } from "@/actions/offering"
import { getGivingGoals } from "@/actions/giving-goal"
import { ensurePermission } from "@/lib/permissions-server"
import { getLocale, getTranslator } from "@/lib/i18n/server"
import { formatLocaleDate, type Locale } from "@church/config"
import { formatMoney } from "@/lib/utils"

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
  searchParams: Promise<{ categoryId?: string; goalId?: string; from?: string; to?: string }>
}

function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return formatLocaleDate(date, locale)
}

async function OfferingsTable({
  offeringsPromise,
  categories,
  goals,
  churchId,
}: {
  offeringsPromise: ReturnType<typeof getOfferings>
  categories: Awaited<ReturnType<typeof getOfferingCategories>>
  goals: Awaited<ReturnType<typeof getGivingGoals>>
  churchId: string
}) {
  const t = await getTranslator()
  const locale = await getLocale()
  const offerings = await offeringsPromise
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))
  const goalNameById = new Map(goals.map((goal) => [goal.id, goal.name]))

  if (offerings.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("staff.offerings.empty")}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("staff.offerings.table.date")}</TableHead>
          <TableHead>{t("staff.offerings.table.category")}</TableHead>
          <TableHead>{t("staff.offerings.table.goal")}</TableHead>
          <TableHead>{t("staff.offerings.table.member")}</TableHead>
          <TableHead className="text-right">{t("staff.offerings.table.amount")}</TableHead>
          <TableHead className="w-24 text-right">{t("staff.offerings.table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offerings.map((offering) => (
          <TableRow key={offering.id}>
            <TableCell>{formatDate(offering.offeringDate, locale)}</TableCell>
            <TableCell>
              {offering.category?.name || categoryNameById.get(offering.categoryId) || offering.categoryId}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {offering.goalId
                ? offering.goal?.name || goalNameById.get(offering.goalId) || offering.goalId
                : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {offering.memberName ?? t("staff.offerings.anonymous")}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatMoney(offering.amountCents, offering.currency)}
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/${churchId}/dashboard/offerings/${offering.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                {t("staff.offerings.edit")}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function OfferingsPage({ params, searchParams }: PageProps) {
  await ensurePermission("manage:offerings")
  const t = await getTranslator()
  const locale = await getLocale()
  const { churchId } = await params
  const filters = await searchParams
  const [categories, goals] = await Promise.all([
    getOfferingCategories(churchId),
    getGivingGoals(churchId).catch(() => []),
  ])
  const offeringsPromise = getOfferings(churchId, filters)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("staff.offerings.title")}</h2>
          <p className="text-muted-foreground">{t("staff.offerings.description")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/offerings/categories`}>
            <Button variant="outline">{t("staff.offerings.categories")}</Button>
          </Link>
          <Link href={`/${churchId}/dashboard/offerings/reports`}>
            <Button variant="outline">{t("staff.offerings.reports")}</Button>
          </Link>
          <Link href={`/${churchId}/dashboard/offerings/add`}>
            <Button>{t("staff.offerings.record")}</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label htmlFor="categoryId" className="text-xs text-muted-foreground">
            {t("staff.offerings.filter.category")}
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={filters.categoryId || ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t("staff.offerings.filter.allCategories")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="goalId" className="text-xs text-muted-foreground">
            {t("staff.offerings.filter.goal")}
          </label>
          <select
            id="goalId"
            name="goalId"
            defaultValue={filters.goalId || ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t("staff.offerings.filter.allGoals")}</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs text-muted-foreground">
            {t("staff.offerings.filter.from")}
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={filters.from || ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs text-muted-foreground">
            {t("staff.offerings.filter.to")}
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={filters.to || ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("staff.offerings.filter.submit")}
        </Button>
        <Link href={`/${churchId}/dashboard/offerings`}>
          <Button type="button" variant="ghost">
            {t("staff.offerings.filter.clear")}
          </Button>
        </Link>
      </form>

      <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <OfferingsTable
          offeringsPromise={offeringsPromise}
          categories={categories}
          goals={goals}
          churchId={churchId}
        />
      </React.Suspense>
    </div>
  )
}
