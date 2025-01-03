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

      async profile(tokens, profile) {
        // console.log("tokens in google provider", tokens)
        // console.log("profile in google provider", profile)
        // console.log("profile in google provider", profile)
        // get the user details
        const email = tokens.email
        let existingUser = await getUserByEmail(email)
        // console.log("found user", existingUser)
        if (!existingUser) {
          console.log(
            "User does not exist, creating new user in google provider profile"
          )
          // User does not exist, create new user
          existingUser = await createUser({
            email: email,
            fullName: "",
            picture: "",
          })
        }
        return {
          email: tokens.email,
          name: tokens.name,
          picture: tokens.picture,
          id: tokens.sub,
          customUser: existingUser,
          ...tokens,
          ...profile,
        }
      },
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
      profile?: Profile | any
    }) {
      // console.log("in signIn callback")
      // console.log("account in signIn callback", account)
      // console.log("profile in signIn callback", profile)
      if (
        account &&
        account.provider === "google" &&
        profile &&
        profile.email
      ) {
        const email = profile?.email
        let existingUser = await getUserByEmail(email)

        if (existingUser && profile) {
          await updateUserProfile(email, {
            picture: profile.picture ?? "",
            name: profile.name || "",
          })
        }

        if (!existingUser) {
          // User does not exist, create new user
          console.log(
            "User does not exist, creating new user in  signIn callback"
          )
          existingUser = await createUser({
            email: email,
            fullName: profile?.name || "",
            picture: profile?.picture || "",
          })
        }
        account.user = existingUser // Attach the user object to the account
      }
      return true
    },
    async session({ session, token }: { session: any; token: any }) {
      // console.log("in session callback")
      // console.log("session in session: ", session)
      // console.log("token in session : ", token)

      // Manually assign parameters
      // session.accessToken = token.access_token
      // session.user.id = token.id
      session.expires = token.expires_at
      session.user.customUser = token.customUser

      // console.log("Final session : ", session)
      return session
    },
    async jwt({
      token,
      user,
    }: {
      token: any
      profile?: any
      user: any
      account?: Account | null
      trigger?: "signIn" | "signUp" | "update"
      isNewUser?: boolean
      session?: any
    }) {
      // console.log("in jwt callback")
      // console.log("token in jwt", token)
      // console.log("user in jwt", user)

      return { ...token, ...user }
    },
  },
}
export default NextAuth(authOptions)

export const getSession = async () => {
  const session = await getServerSession(authOptions)
  return session
}
