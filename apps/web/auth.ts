import NextAuth, {
  getServerSession,
  type NextAuthOptions,
  type Session,
  type JWT,
} from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { env } from "@/env.js"

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
    }
  }

  interface JWT {
    accessToken?: string
    refreshToken?: string
  }
}

const getApiUrl = (): string => {
  // Use 127.0.0.1 for server-side requests to avoid localhost resolution issues
  if (typeof window === "undefined") {
    return process.env.API_BASE_URL || "http://127.0.0.1:3001"
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: env.NEXTAUTH_SECRET || "default-secret-change-in-production",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin?error=auth_error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          // Use localhost for internal server-to-server call
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
          const response = await fetch(`${baseUrl}/api/auth/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              picture: (profile as any).picture,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error("[Auth] Backend sync failed:", response.status, errorData)
            return false
          }

          const data = await response.json()
          // The backend returns the user and tokens in data.data or directly
          const authData = data.data || data
          
          ;(user as any).accessToken = authData.accessToken
          ;(user as any).refreshToken = authData.refreshToken
          return true
        } catch (error) {
          console.error("[Auth] Sign-in sync error:", error)
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      // Store tokens from API response
      if (user) {
        const userData = user as any
        if (userData.accessToken) {
          token.accessToken = userData.accessToken
        }
        if (userData.refreshToken) {
          token.refreshToken = userData.refreshToken
        }
      }

      return token
    },

    async session({ session, token }) {
      // Add API tokens to session
      if (session.user) {
        session.user.id = token.sub
      }

      // Add access token to session for API calls
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }

      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string
      }

      return session
    },
  },
}

export default NextAuth(authOptions)

export const getSession = async (): Promise<Session | null> => {
  const session = await getServerSession(authOptions)
  return session
}
