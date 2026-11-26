import { withAuth } from "next-auth/middleware"
import { encode } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import { isRouteAllowed } from "@/config/routes"
import { env } from "@/env.mjs"
import { applyRotatedTokens, getRotatedTokens, type RotatedTokens } from "@/lib/auth-refresh"

const SESSION_MAX_AGE = 30 * 24 * 60 * 60
// Rotate this long before the access token expires, so pages never render with a dead token.
const REFRESH_AHEAD_SECONDS = 60
const SESSION_COOKIE_NAMES = ["__Secure-next-auth.session-token", "next-auth.session-token"]

interface SessionRotation {
  name: string
  value: string
  token: Record<string, any>
}

function sessionCookieName(req: NextRequest): string | null {
  return SESSION_COOKIE_NAMES.find((name) => req.cookies.has(name)) ?? null
}

/**
 * Rotates the refresh token shortly before the access token expires and returns the
 * re-encoded session cookie. Failures return null: the jwt callback still handles
 * an expired or rejected session.
 */
async function rotateSession(req: NextRequest, token: Record<string, any>): Promise<SessionRotation | null> {
  const name = sessionCookieName(req)
  if (!name || typeof token.refreshToken !== "string" || typeof token.expiresAt !== "number") return null
  if (token.expiresAt > Date.now() / 1000 + REFRESH_AHEAD_SECONDS) return null

  try {
    const rotated: RotatedTokens = await getRotatedTokens(env.API_BASE_URL, token.refreshToken)
    const updated = applyRotatedTokens(token, rotated)
    const value = await encode({ token: updated, secret: env.NEXTAUTH_SECRET, maxAge: SESSION_MAX_AGE })
    return { name, value, token: updated }
  } catch {
    // The session stays as it is; the jwt callback still handles an expired or rejected one.
    return null
  }
}

/** Request headers with the session cookie replaced, so this request's server components see the new session. */
function forwardHeaders(req: NextRequest, rotation: SessionRotation): Headers {
  const headers = new Headers(req.headers)
  const parts = (req.headers.get("cookie") ?? "").split(";").map((p) => p.trim()).filter(Boolean)
  const replaced = parts.map((p) => (p.startsWith(`${rotation.name}=`) ? `${rotation.name}=${rotation.value}` : p))
  headers.set("cookie", replaced.join("; "))
  return headers
}

function withSessionCookie(response: NextResponse, rotation: SessionRotation | null): NextResponse {
  if (rotation) {
    response.cookies.set(rotation.name, rotation.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: rotation.name.startsWith("__Secure-"),
      maxAge: SESSION_MAX_AGE,
    })
  }
  return response
}

export default withAuth(
  async function middleware(req: any) {
    const sessionToken = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // If user is not authenticated, let next-auth handle the redirect
    if (!sessionToken) {
      return NextResponse.next()
    }

    const rotation = await rotateSession(req, sessionToken)
    const token = rotation?.token ?? sessionToken
    const next = () =>
      withSessionCookie(
        NextResponse.next(rotation ? { request: { headers: forwardHeaders(req, rotation) } } : undefined),
        rotation,
      )

    // Check if this is a setup route
    if (pathname === "/setup") {
      // Only users without a churchId should access setup
      if (token.activeChurchId || token.churchId) {
        return withSessionCookie(NextResponse.redirect(new URL("/", req.url)), rotation)
      }
      return next()
    }

    // Check role-based access for protected routes
    const userRole = (token.activeRole || token.role) as string
    if (!isRouteAllowed(pathname, userRole)) {
      return withSessionCookie(NextResponse.redirect(new URL("/forbidden", req.url)), rotation)
    }

    return next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access if token exists
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // churches(/...)? is the public church directory (no sign-in required).
    "/((?!api|_next/static|_next/image|favicon.ico|auth|signin|churches(?:/|$)|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
  ],
}
