import { ensurePermission } from "@/lib/permissions-server"
import { getOfferingReportSummary, getOfferingCategories } from "@/actions/offering"
import { formatMoney } from "@/lib/utils"
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
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ period?: "week" | "month" | "year"; from?: string; to?: string }>
}

// API returns { groupKey, currency, totalCents } for both groupBy=category and groupBy=period.
// For groupBy=category, groupKey is the raw categoryId - resolve it to a name via categoriesById.
function categoryLabel(row: { groupKey: string }, categoriesById: Map<string, string>): string {
  return categoriesById.get(row.groupKey) ?? row.groupKey
}

export default async function OfferingReportsPage({ params, searchParams }: PageProps) {
  await ensurePermission("view:giving-reports")
  const { churchId } = await params
  const { period = "month", from, to } = await searchParams

  const [byCategory, byPeriod, categories] = await Promise.all([
    getOfferingReportSummary(churchId, "category", { from, to }),
    getOfferingReportSummary(churchId, "period", { period, from, to }),
    getOfferingCategories(churchId),
  ])
  const categoriesById = new Map<string, string>(categories.map((c: any) => [c.id, c.name]))

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Giving Reports</h2>
        <p className="text-muted-foreground">
          Totals by category and by period. Each currency is its own row - never combined.
        </p>
      </div>
      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Totals by Category</h3>
        {byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for this range.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCategory.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{categoryLabel(row, categoriesById)}</TableCell>
                  <TableCell>{row.currency}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(row.totalCents, row.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Totals by Period ({period})</h3>
        {byPeriod.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for this range.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byPeriod.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.groupKey}</TableCell>
                  <TableCell>{row.currency}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(row.totalCents, row.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
