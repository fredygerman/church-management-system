import type { MessageKey, PermissionAction } from "@church/config"

export interface ReportDefinition {
  title: string
  /** Message key for the translated title. `title` is the English fallback. */
  titleKey: MessageKey
  /** Path under /[churchId] of the page that shows the figures. */
  href: string
  /** Every permission the page requires: the route rule (config/routes.ts) and the page's own check. */
  permissions: PermissionAction[]
  /** One-line definition. Mirrored in docs/shipwave/platform/specs/api-contracts.md (DEC-04). */
  definition: string
  /** Message key for the translated definition. `definition` is the English fallback. */
  definitionKey: MessageKey
}

/**
 * Reports the web app shows. A metric is listed only when it has a verified source:
 * the query behind an existing endpoint (DEC-04).
 */
export const REPORTS: ReportDefinition[] = [
  {
    title: "Attendance trends",
    titleKey: "sweep.b.report.attendanceTrends.title",
    href: "/dashboard/attendance/analytics",
    permissions: ["view:attendance"],
    definition:
      "Check-ins per zone, gender or age band for a date range. Counts check-in records for sessions dated in the range; unique members and sessions are counted within each group. A member in several zones is counted in each zone.",
    definitionKey: "sweep.b.report.attendanceTrends.definition",
  },
  {
    title: "Giving summary",
    titleKey: "sweep.b.report.givingSummary.title",
    href: "/dashboard/offerings/reports",
    permissions: ["manage:offerings", "view:giving-reports"],
    definition:
      "Sum of non-deleted offerings by category, or by week, month or year of offering date. Totals are shown separately for each currency.",
    definitionKey: "sweep.b.report.givingSummary.definition",
  },
]

/** Definitions shown on the attendance trends page, in the same words as the contracts doc. */
export const ATTENDANCE_MEASURES = [
  {
    label: "Total check-ins",
    labelKey: "sweep.b.attendance.measure.totalCheckins.label",
    definition: "Check-in records for sessions dated in the range.",
    definitionKey: "sweep.b.attendance.measure.totalCheckins.definition",
  },
  {
    label: "Unique members",
    labelKey: "sweep.b.attendance.measure.uniqueMembers.label",
    definition: "Distinct members with at least one check-in in the group.",
    definitionKey: "sweep.b.attendance.measure.uniqueMembers.definition",
  },
  {
    label: "Sessions",
    labelKey: "sweep.b.attendance.measure.sessions.label",
    definition: "Distinct sessions with at least one check-in in the group.",
    definitionKey: "sweep.b.attendance.measure.sessions.definition",
  },
  {
    label: "Avg / session",
    labelKey: "sweep.b.attendance.measure.avgPerSession.label",
    definition: "Total check-ins divided by sessions.",
    definitionKey: "sweep.b.attendance.measure.avgPerSession.definition",
  },
] as const
