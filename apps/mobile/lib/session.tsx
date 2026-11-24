import { router, useSegments } from "expo-router"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { ApiError, api, setSessionExpiredHandler, signOutRequest } from "./api"
import { decodeAccessClaims, isStaffRole } from "./claims"
import { clearStoredTokens, getStoredTokens, storeTokens, type StoredTokens } from "./storage"

export type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  churchId?: string | null
  /** Church and role of the access token: the space the user is working in. */
  activeChurchId?: string | null
  activeRole?: string | null
  [key: string]: unknown
}
type AuthResponse = StoredTokens & { user: SessionUser }
type SessionContextValue = {
  ready: boolean
  signedIn: boolean
  isStaff: boolean
  user: SessionUser | null
  signIn: (response: AuthResponse) => Promise<void>
  switchChurch: (churchId: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

function withClaims(user: SessionUser, tokens: StoredTokens): SessionUser {
  const claims = decodeAccessClaims(tokens.accessToken)
  const activeChurchId = claims.activeChurchId ?? user.churchId ?? null
  return {
    ...user,
    // churchId follows the active space (as on web), so screens that read it show the church being worked in.
    churchId: activeChurchId,
    activeChurchId,
    activeRole: claims.activeRole ?? (typeof user.role === "string" ? user.role : null),
  }
}

/** Loads the signed-in user for the space the stored access token points at. */
async function loadUser(tokens: StoredTokens): Promise<SessionUser> {
  const me = await api.get<SessionUser>("/users/me")
  return withClaims(me, tokens)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null))
    let active = true
    getStoredTokens().then(async (tokens) => {
      if (tokens) {
        try {
          const currentUser = await loadUser(tokens)
          if (active) setUser(currentUser)
        } catch (error) {
          // Only a rejected session is cleared. An unreachable API keeps the stored session for the next launch.
          if (error instanceof ApiError && error.kind === "http") await clearStoredTokens()
        }
      }
      if (active) setReady(true)
    })
    return () => { active = false; setSessionExpiredHandler(undefined) }
  }, [])

  const value = useMemo<SessionContextValue>(() => ({
    ready,
    signedIn: Boolean(user),
    isStaff: isStaffRole(user?.activeRole ?? undefined),
    user,
    signIn: async (response) => {
      await storeTokens(response)
      setUser(withClaims(response.user, response))
    },
    // The API issues a new token pair for the chosen church; the old pair stops being used.
    switchChurch: async (churchId) => {
      const previous = await getStoredTokens()
      const tokens = await api.post<StoredTokens>("/auth/switch-church", { churchId })
      await storeTokens(tokens)
      try {
        setUser(await loadUser(tokens))
      } catch (error) {
        // The stored pair and the screen must agree: restore the space the user was in.
        if (previous) await storeTokens(previous)
        throw error
      }
    },
    signOut: async () => { await signOutRequest(); setUser(null) },
  }), [ready, user])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error("useSession must be used inside SessionProvider")
  return context
}

export function SessionGate() {
  const { ready, signedIn, isStaff } = useSession()
  const segments = useSegments()

  useEffect(() => {
    if (!ready) return
    const area = segments[0]
    const inAuth = area === "(auth)"
    const inMember = area === "(member)"
    const inStaff = area === "(staff)"
    if (!signedIn) {
      if (inMember || inStaff) router.replace("/(auth)/sign-in")
      return
    }
    // Signed-in users belong in the area for their active role; a space switch moves them too.
    const home = isStaff ? "/(staff)" : "/(member)"
    if (inAuth || (isStaff && inMember) || (!isStaff && inStaff)) router.replace(home)
  }, [ready, signedIn, isStaff, segments])

  return null
}
