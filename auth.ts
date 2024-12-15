import NextAuth, { getServerSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
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
}
export default NextAuth(authOptions)

export const getSession = async () => {
  const session = await getServerSession(authOptions)
  return session
}
