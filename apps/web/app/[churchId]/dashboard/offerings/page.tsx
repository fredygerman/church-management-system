import React from "react"
import Link from "next/link"
import { getOfferings, getOfferingCategories } from "@/actions/offering"
import { ensurePermission } from "@/lib/permissions-server"
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
  searchParams: Promise<{ categoryId?: string; from?: string; to?: string }>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString()
}

async function OfferingsTable({
  offeringsPromise,
  categories,
  churchId,
}: {
  offeringsPromise: ReturnType<typeof getOfferings>
  categories: Awaited<ReturnType<typeof getOfferingCategories>>
  churchId: string
}) {
  const offerings = await offeringsPromise
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))

  if (offerings.length === 0) {
    return <p className="text-sm text-muted-foreground">No offerings recorded for this filter.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Member</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offerings.map((offering) => (
          <TableRow key={offering.id}>
            <TableCell>{formatDate(offering.offeringDate)}</TableCell>
            <TableCell>
              {offering.category?.name || categoryNameById.get(offering.categoryId) || offering.categoryId}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {offering.memberName ?? "Anonymous"}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatMoney(offering.amountCents, offering.currency)}
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/${churchId}/dashboard/offerings/${offering.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                Edit
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
  const { churchId } = await params
  const filters = await searchParams
  const categories = await getOfferingCategories(churchId)
  const offeringsPromise = getOfferings(churchId, filters)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Offerings</h2>
          <p className="text-muted-foreground">Record and review giving for your church.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/offerings/categories`}>
            <Button variant="outline">Categories</Button>
          </Link>
          <Link href={`/${churchId}/dashboard/offerings/reports`}>
            <Button variant="outline">Reports</Button>
          </Link>
          <Link href={`/${churchId}/dashboard/offerings/add`}>
            <Button>Record Offering</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label htmlFor="categoryId" className="text-xs text-muted-foreground">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={filters.categoryId || ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs text-muted-foreground">
            From
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
            To
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
          Filter
        </Button>
        <Link href={`/${churchId}/dashboard/offerings`}>
          <Button type="button" variant="ghost">
            Clear
          </Button>
        </Link>
      </form>

      <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <OfferingsTable
          offeringsPromise={offeringsPromise}
          categories={categories}
          churchId={churchId}
        />
      </React.Suspense>
    </div>
  )
}
