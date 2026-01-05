/**
 * Route access configuration
 * Maps protected routes to allowed user roles
 */

export type UserRole = "super_admin" | "admin" | "branch_admin" | "zone_leader" | "member"

export const protectedRoutes: Record<string, UserRole[]> = {
  "/setup": ["member"],
  "/[churchId]/dashboard": ["super_admin", "admin", "branch_admin", "zone_leader"],
  "/[churchId]/members": ["super_admin", "admin", "branch_admin"],
  "/[churchId]/zones": ["super_admin", "admin", "branch_admin"],
  "/[churchId]/families": ["super_admin", "admin", "branch_admin"],
  "/[churchId]/visitors": ["super_admin", "admin", "branch_admin"],
}

/**
 * Public routes that don't require authentication
 */
export const publicRoutes = [
  "/auth/signin",
  "/auth/callback",
  "/auth/error",
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
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    // Convert route pattern to regex (e.g., /[churchId]/dashboard -> /[^/]+/dashboard)
    const routePattern = new RegExp(
      "^" + route.replace(/\[churchId\]/g, "[^/]+") + "(/|$)"
    )

    if (routePattern.test(pathname)) {
      return allowedRoles.includes(userRole as UserRole)
    }
  }

  return true
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
