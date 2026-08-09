import NextAuth, {
  getServerSession,
  type NextAuthOptions,
  type Session,
} from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { env } from "./env.mjs"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    user: {
      id?: string
      email?: string | null
      name?: string | null
      image?: string | null
      role?: string
      churchId?: string | null
      activeChurchId?: string | null
      activeMembershipId?: string | null
      activeRole?: string
      assignedZoneId?: string | null
    }
  }

  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    role?: string
    churchId?: string | null
    activeChurchId?: string | null
    activeMembershipId?: string | null
    activeRole?: string
    assignedZoneId?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
        refreshToken: { label: "Refresh Token", type: "text" },
      },
      async authorize(credentials) {
        // This is called when tokens are passed from the OAuth callback
        if (!credentials?.accessToken || !credentials?.refreshToken) {
          return null
        }

        try {
          // Decode the access token to get user info
          // JWT tokens have 3 parts separated by dots
          const tokenParts = credentials.accessToken.split(".")
          if (tokenParts.length !== 3) {
            console.error("[Auth] Invalid token format")
            return null
          }

          // Decode the payload (second part) from base64
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], "base64").toString()
          )

          // Return user object with tokens
          return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            image: payload.picture,
            role: payload.activeRole || payload.role,
            churchId: payload.activeChurchId || payload.churchId,
            activeChurchId: payload.activeChurchId || payload.churchId,
            activeMembershipId: payload.activeMembershipId,
            activeRole: payload.activeRole || payload.role,
            assignedZoneId: payload.assignedZoneId,
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
          }
        } catch (error) {
          console.error("[Auth] Token decode error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin?error=auth_error",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Called when user is logged in or token is refreshed
      if (user) {
        const userData = user as any
        token.sub = userData.id
        token.accessToken = userData.accessToken
        token.refreshToken = userData.refreshToken
        token.email = userData.email
        token.role = userData.activeRole || userData.role
        token.churchId = userData.activeChurchId || userData.churchId
        token.activeChurchId = userData.activeChurchId || userData.churchId
        token.activeMembershipId = userData.activeMembershipId
        token.activeRole = userData.activeRole || userData.role
        token.assignedZoneId = userData.assignedZoneId
        
        // Store token expiration time (1 hour from now)
        token.expiresAt = Math.floor(Date.now() / 1000) + 3600
      }

      // Handle token refresh if access token is expired
      if (token.expiresAt && typeof token.expiresAt === "number" && Math.floor(Date.now() / 1000) >= token.expiresAt) {
        try {
          const response = await fetch(`${env.API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: token.refreshToken }),
          })

          if (!response.ok) {
            console.error("[Auth] Token refresh failed:", response.status)
            // Clear the token if refresh fails
            return {
              ...token,
              sub: undefined,
              accessToken: undefined,
              refreshToken: undefined,
            }
          }

          const data = await response.json()
          const tokens = data.data || data

          // Decode the new access token to get updated user info
          const tokenParts = tokens.accessToken.split(".")
          if (tokenParts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(tokenParts[1], "base64").toString()
            )
            
            return {
              ...token,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: Math.floor(Date.now() / 1000) + 3600,
              role: payload.activeRole || payload.role,
              churchId: payload.activeChurchId || payload.churchId,
              activeChurchId: payload.activeChurchId || payload.churchId,
              activeMembershipId: payload.activeMembershipId,
              activeRole: payload.activeRole || payload.role,
              assignedZoneId: payload.assignedZoneId,
            }
          }

          return {
            ...token,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
          }
        } catch (error) {
          console.error("[Auth] Token refresh error:", error)
          // Clear the token if refresh fails
          return {
            ...token,
            sub: undefined,
            accessToken: undefined,
            refreshToken: undefined,
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      // Add tokens and user info to session from JWT
      if (token.sub) {
        session.user.id = token.sub
        session.user.role = (token.activeRole || token.role) as string
        session.user.churchId = (token.activeChurchId || token.churchId) as string
        session.user.activeChurchId = (token.activeChurchId || token.churchId) as string
        session.user.activeMembershipId = token.activeMembershipId as string
        session.user.activeRole = (token.activeRole || token.role) as string
        session.user.assignedZoneId = token.assignedZoneId as string
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
      } else {
        // User is not authenticated, clear the session
        return { ...session, user: { email: null, name: null, image: null } }
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Allow relative URLs to pass through
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

export const getSession = async (): Promise<Session | null> => {
  return await getServerSession(authOptions)
}
