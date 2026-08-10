import { ensurePermission } from "@/lib/permissions-server"
import { getOfferingReportSummary } from "@/actions/offering"
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

// The API's exact field names for the summary rows aren't nailed down yet
// (built concurrently) - fall back across the plausible field names rather
// than assume one, but always keep amountCents/currency exact (integer math).
function dimensionLabel(row: any): string {
  return (
    row.categoryName ??
    row.category?.name ??
    (typeof row.category === "string" ? row.category : undefined) ??
    row.period ??
    row.label ??
    row.categoryId ??
    "Unknown"
  )
}

function rowAmountCents(row: any): number {
  return row.amountCents ?? row.totalAmountCents ?? row.total ?? row.sum ?? 0
}

export default async function OfferingReportsPage({ params, searchParams }: PageProps) {
  await ensurePermission("view:giving-reports")
  const { churchId } = await params
  const { period = "month", from, to } = await searchParams

  const [byCategory, byPeriod] = await Promise.all([
    getOfferingReportSummary(churchId, "category", { from, to }),
    getOfferingReportSummary(churchId, "period", { period, from, to }),
  ])

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
                  <TableCell>{dimensionLabel(row)}</TableCell>
                  <TableCell>{row.currency}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(rowAmountCents(row), row.currency)}
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
                  <TableCell>{dimensionLabel(row)}</TableCell>
                  <TableCell>{row.currency}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(rowAmountCents(row), row.currency)}
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
