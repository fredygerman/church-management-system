/**
 * Route access configuration
 * Maps protected routes to required permissions
 */

import type { PermissionAction } from "@/lib/permissions"
import { hasPermission } from "@/lib/permissions"

export const protectedRoutes: Record<string, PermissionAction> = {
  "/setup": "read:self",
  "/[churchId]/portal": "read:self",
  "/[churchId]/portal/profile": "read:self",
  "/[churchId]/portal/family": "read:self",
  "/[churchId]/portal/attendance": "read:self",
  "/[churchId]/portal/prayer": "read:self",
  "/[churchId]/portal/announcements": "read:self",
  "/[churchId]/portal/departments": "read:department",
  "/[churchId]/dashboard": "read:member",
  "/[churchId]/dashboard/home": "read:member",
  "/[churchId]/dashboard/profile": "read:self",
  "/[churchId]/dashboard/content": "manage:files",
  "/[churchId]/dashboard/more": "read:self",
  "/[churchId]/dashboard/members": "read:member",
  "/[churchId]/dashboard/zones": "read:zone",
  "/[churchId]/dashboard/departments": "read:department",
  "/[churchId]/dashboard/families": "view:families",
  "/[churchId]/dashboard/visitors": "view:visitors",
  "/[churchId]/dashboard/permissions": "manage:users",
  "/[churchId]/dashboard/attendance": "view:attendance",
  "/[churchId]/dashboard/attendance/service-types": "manage:services",
  "/[churchId]/dashboard/attendance/sessions": "manage:services",
  "/[churchId]/dashboard/attendance/check-in": "manage:attendance",
  "/[churchId]/dashboard/attendance/analytics": "view:attendance",
  "/[churchId]/dashboard/attendance/at-risk": "view:risk-flags",
  "/[churchId]/dashboard/attendance/risk-settings": "manage:risk-settings",
  "/[churchId]/dashboard/communications": "view:communications",
  "/[churchId]/dashboard/communications/templates": "manage:communications",
  "/[churchId]/dashboard/communications/campaigns": "view:communications",
  "/[churchId]/dashboard/communications/campaigns/new": "manage:communications",
  "/[churchId]/dashboard/data-quality": "view:data-quality",
  "/[churchId]/dashboard/data-quality/imports": "view:data-quality",
  "/[churchId]/dashboard/data-quality/duplicates": "view:data-quality",
  "/[churchId]/dashboard/attendance/v2": "manage:attendance-analytics",
  "/[churchId]/dashboard/family-lifecycle": "view:lifecycle-dashboard",
  "/[churchId]/dashboard/analytics": "manage:attendance-analytics",
  "/[churchId]/dashboard/offerings": "manage:offerings",
  "/[churchId]/dashboard/events": "view:events",
  "/[churchId]/dashboard/events/add": "manage:events",
  "/[churchId]/dashboard/events/[id]/edit": "manage:events",
}

/**
 * Public routes that don't require authentication
 */
export const publicRoutes = [
  "/auth/signin",
  "/auth/callback",
  "/auth/error",
  "/forbidden",
]

/**
 * Routes that redirect authenticated users away
 * (e.g., if already signed in, shouldn't see sign-in page)
 */
export const authRoutes = [
  "/auth/signin",
  "/auth/callback",
  "/auth/error",
]

/**
 * Check if a user role is allowed to access a given route
 */
export function isRouteAllowed(pathname: string, userRole: string): boolean {
  // The most specific (longest) matching route decides. A broad rule such as
  // /[churchId]/dashboard must not shadow the child routes listed after it.
  let match: { route: string; permission: PermissionAction } | null = null

  for (const [route, requiredPermission] of Object.entries(protectedRoutes)) {
    // Convert route pattern to regex, e.g. /[churchId]/events/[id]/edit -> /[^/]+/events/[^/]+/edit
    const routePattern = new RegExp("^" + route.replace(/\[[^\]]+\]/g, "[^/]+") + "(/|$)")

    if (routePattern.test(pathname) && (!match || route.length > match.route.length)) {
      match = { route, permission: requiredPermission }
    }
  }

  return match ? hasPermission(userRole, match.permission) : true
}

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route))
}
