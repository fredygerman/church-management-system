import Link from "next/link"
import { getSession } from "@/auth"
import { hasPermission } from "@/lib/permissions"
import { REPORTS } from "@/lib/report-catalog"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function ReportsPage({ params }: PageProps) {
  const { churchId } = await params
  const session = await getSession()
  const role = session?.user?.activeRole || session?.user?.role
  // Only reports the caller's role may open are listed; each page still checks on its own.
  const available = REPORTS.filter((report) => hasPermission(role, report.permission))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Each report shows figures from an existing query. The definition is listed beside it.
        </p>
      </div>

      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports are available for your role.</p>
      ) : (
        <ul className="space-y-3">
          {available.map((report) => (
            <li key={report.href} className="rounded-md border p-4">
              <Link href={`/${churchId}${report.href}`} className="font-medium underline-offset-4 hover:underline">
                {report.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{report.definition}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
