import type { PermissionAction } from "@church/config"

export interface ReportDefinition {
  title: string
  /** Path under /[churchId] of the page that shows the figures. */
  href: string
  /** Permission that page requires (same rule as config/routes.ts). */
  permission: PermissionAction
  /** One-line definition. Mirrored in docs/shipwave/platform/specs/api-contracts.md (DEC-04). */
  definition: string
}

/**
 * Reports the web app shows. A metric is listed only when it has a verified source:
 * the query behind an existing endpoint (DEC-04).
 */
export const REPORTS: ReportDefinition[] = [
  {
    title: "Attendance trends",
    href: "/dashboard/attendance/analytics",
    permission: "view:attendance",
    definition:
      "Check-ins per zone, gender or age band for a date range. Counts check-in records for sessions dated in the range; unique members and sessions are counted within each group.",
  },
  {
    title: "Giving summary",
    href: "/dashboard/offerings/reports",
    permission: "manage:offerings",
    definition:
      "Sum of non-deleted offerings by category, or by week, month or year of offering date. Totals are shown separately for each currency.",
  },
]

/** Definitions shown on the attendance trends page, in the same words as the contracts doc. */
export const ATTENDANCE_MEASURES = [
  { label: "Total check-ins", definition: "Check-in records for sessions dated in the range." },
  { label: "Unique members", definition: "Distinct members with at least one check-in in the group." },
  { label: "Sessions", definition: "Distinct sessions with at least one check-in in the group." },
  { label: "Avg / session", definition: "Total check-ins divided by sessions." },
] as const
