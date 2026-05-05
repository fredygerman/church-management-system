import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { isRouteAllowed } from "@/config/routes"

export default withAuth(
  function middleware(req: any) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // If user is not authenticated, let next-auth handle the redirect
    if (!token) {
      return NextResponse.next()
    }

    // Check if this is a setup route
    if (pathname === "/setup") {
      // Only users without a churchId should access setup
      if (token.churchId) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // Check role-based access for protected routes
    const userRole = token.role as string
    if (!isRouteAllowed(pathname, userRole)) {
      return NextResponse.redirect(new URL("/forbidden", req.url))
    }

    return NextResponse.next()
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
    "/((?!api|_next/static|_next/image|favicon.ico|auth|signin|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
  ],
}
