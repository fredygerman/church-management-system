import { createUser, getUserByEmail, updateUserProfile } from "@/actions/users"
import NextAuth, {
  getServerSession,
  type Account,
  type NextAuthOptions,
  type Profile,
} from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/signin",
    // signOut: "/auth/signout",
  },
  callbacks: {
    async signIn({
      account,
      profile,
    }: {
      account: Account | null
      profile?: Profile
    }) {
      console.log("in signIn callback")
      console.log("account", account)
      console.log("profile", profile)
      if (account && account.provider === "google") {
        const email = profile?.email
        if (!email) {
          return false
        }
        let existingUser = await getUserByEmail(email)

        if (existingUser && profile) {
          await updateUserProfile(email, {
            picture: profile.image || "",
            name: profile.name || "",
          })
        }

        if (!existingUser) {
          // User does not exist, create new user
          existingUser = await createUser({
            email: email,
            fullName: profile?.name || "",
            picture: profile?.image || "",
          })
        }
      }
      return true
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id
      return session
    },
    async jwt({ token }: { token: any }) {
      // console.log("in jwt callback")
      // console.log("token", token)

      return token
    },
  },
}
export default NextAuth(authOptions)

export const getSession = async () => {
  const session = await getServerSession(authOptions)
  return session
}
