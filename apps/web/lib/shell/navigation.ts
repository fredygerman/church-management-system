// Shared shell contract for member and staff spaces (R-UX-01). Pure helpers only.
// Links are convenience: every page and API still checks permissions server-side.

export type Space = "member" | "staff"

export interface SpaceDestination {
  key: string
  // Message key from the shared catalogue; no English text here.
  labelKey: "nav.home" | "nav.church" | "nav.events" | "nav.library" | "portal.nav.profile" | "nav.members" | "nav.content" | "nav.more" | "wiring.nav.resources" | "wiring.nav.inbox"
  segment: string // path after /{churchId}/
}

// Five primary member destinations. Events, resources, inbox and prayer live behind the More hub.
export const MEMBER_DESTINATIONS: SpaceDestination[] = [
  { key: "home", labelKey: "nav.home", segment: "portal" },
  { key: "church", labelKey: "nav.church", segment: "portal/church" },
  { key: "library", labelKey: "nav.library", segment: "portal/library" },
  { key: "profile", labelKey: "portal.nav.profile", segment: "portal/profile" },
  { key: "more", labelKey: "nav.more", segment: "portal/more" },
]

export const STAFF_DESTINATIONS: SpaceDestination[] = [
  { key: "dashboard", labelKey: "nav.home", segment: "dashboard/home" },
  { key: "people", labelKey: "nav.members", segment: "dashboard/members" },
  { key: "services", labelKey: "nav.events", segment: "dashboard/events" },
  { key: "content", labelKey: "nav.content", segment: "dashboard/content" },
  { key: "more", labelKey: "nav.more", segment: "dashboard/more" },
]

/** Builds `/{churchId}/{segment}`. Returns null when church context is missing, so no `undefined` path is ever produced. */
export function churchPath(churchId: string | null | undefined, segment = ""): string | null {
  if (!churchId || !churchId.trim()) return null
  const base = `/${encodeURIComponent(churchId)}`
  return segment ? `${base}/${segment}` : base
}

/** Only ordinary members are not staff. Staff status comes from role, never from a read:member grant. */
export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && role !== "member"
}

export function spaceDestinations(space: Space, churchId: string, role: string | null | undefined): { key: string; labelKey: SpaceDestination["labelKey"]; href: string }[] {
  if (space === "staff" && !isStaffRole(role)) return []
  const list = space === "staff" ? STAFF_DESTINATIONS : MEMBER_DESTINATIONS
  return list.flatMap((item) => {
    const href = churchPath(churchId, item.segment)
    return href ? [{ key: item.key, labelKey: item.labelKey, href }] : []
  })
}

/** Accepts only same-origin absolute paths such as /abc/portal. Rejects protocol-relative, backslash and control-character forms. */
export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value || value.length > 2048) return false
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return false
  return !/[\u0000-\u001f\u007f\\]/.test(value)
}

/** Sign-in landing: a safe callback wins; otherwise staff land in staff space and members in member Home. */
export function postSignInPath(input: { callbackUrl?: string | null; churchId?: string | null; role?: string | null }): string {
  if (isSafeInternalPath(input.callbackUrl)) return input.callbackUrl
  const segment = isStaffRole(input.role) ? "dashboard/home" : "portal"
  return churchPath(input.churchId, segment) ?? "/setup"
}
