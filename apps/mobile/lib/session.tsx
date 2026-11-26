import { router, useSegments } from "expo-router"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { api, clearSession, persistSession, setSessionExpiredHandler, signOutRequest } from "./api"
import { decodeAccessClaims, isStaffRole } from "./claims"
import { createRequestGate } from "./request-gate"
import { restoreSession } from "./restore"
import { getStoredTokens, type StoredTokens } from "./storage"
import { ErrorState, LoadingState, styles } from "../components/screen-state"
import { Button, View } from "react-native"
import { useT } from "./locale"

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
/** initializing: startup not settled. unavailable: stored credentials exist but could not be checked; they are kept. */
export type SessionStatus = "initializing" | "signed-in" | "signed-out" | "unavailable"
/** Presentation space. Independent of membership: it never grants a role. */
export type PresentationSpace = "member" | "staff"

type SessionContextValue = {
  ready: boolean
  status: SessionStatus
  signedIn: boolean
  isStaff: boolean
  space: PresentationSpace
  setSpace: (space: PresentationSpace) => void
  /** Changes whenever the signed-in context (user, church, role or sign-in) changes. Screens reload when it changes. */
  contextKey: string
  user: SessionUser | null
  signIn: (response: AuthResponse) => Promise<void>
  switchChurch: (churchId: string) => Promise<void>
  signOut: () => Promise<void>
  retryStartup: () => void
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
  const [status, setStatus] = useState<SessionStatus>("initializing")
  const [user, setUser] = useState<SessionUser | null>(null)
  // Bumped on every user change, including sign-out, so screens reload for the new context.
  const [epoch, setEpoch] = useState(0)
  // In-memory only: the space chosen for one context. Reset by a sign-in, church switch or sign-out.
  const [spaceChoice, setSpaceChoice] = useState<{ key: string; space: PresentationSpace } | null>(null)
  const startupGate = useRef(createRequestGate()).current

  const replaceUser = useCallback((next: SessionUser | null) => {
    setUser(next)
    setEpoch((value) => value + 1)
  }, [])

  const startup = useCallback(async () => {
    const isCurrent = startupGate.start()
    setStatus("initializing")
    const result = await restoreSession<SessionUser>({ readTokens: getStoredTokens, loadUser, clear: clearSession })
    if (!isCurrent()) return
    if (result.status === "authenticated") {
      replaceUser(result.user)
      setStatus("signed-in")
    } else {
      replaceUser(null)
      setStatus(result.status === "signed-out" ? "signed-out" : "unavailable")
    }
  }, [replaceUser, startupGate])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      replaceUser(null)
      setStatus("signed-out")
    })
    void startup()
    return () => { startupGate.invalidate(); setSessionExpiredHandler(undefined) }
  }, [replaceUser, startup, startupGate])

  const isStaff = isStaffRole(user?.activeRole ?? undefined)
  const contextKey = `${epoch}:${user?.activeChurchId ?? ""}:${user?.activeRole ?? ""}`
  const space: PresentationSpace = isStaff && spaceChoice?.key === contextKey ? spaceChoice.space : isStaff ? "staff" : "member"

  const value = useMemo<SessionContextValue>(() => ({
    ready: status !== "initializing",
    status,
    signedIn: Boolean(user),
    isStaff,
    space,
    setSpace: (next) => {
      // Only a staff-capable account can choose the staff space; member space is always allowed.
      if (!isStaff && next === "staff") return
      setSpaceChoice({ key: contextKey, space: next })
    },
    contextKey,
    user,
    signIn: async (response) => {
      await persistSession(response)
      replaceUser(withClaims(response.user, response))
      setStatus("signed-in")
    },
    // The API issues a new token pair for the chosen church; the old pair stops being used.
    switchChurch: async (churchId) => {
      const previous = await getStoredTokens()
      const tokens = await api.post<StoredTokens>("/auth/switch-church", { churchId })
      await persistSession(tokens)
      try {
        replaceUser(await loadUser(tokens))
      } catch (error) {
        // The stored pair and the screen must agree: restore the space the user was in.
        if (previous) await persistSession(previous)
        throw error
      }
    },
    signOut: async () => {
      try {
        await signOutRequest()
      } finally {
        replaceUser(null)
        setStatus("signed-out")
      }
    },
    retryStartup: () => { void startup() },
  }), [status, user, isStaff, space, contextKey, epoch, replaceUser, startup])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error("useSession must be used inside SessionProvider")
  return context
}

/** Routes signed-in users to the space they chose, and renders startup and unavailable states. */
export function SessionGate({ children }: { children: ReactNode }) {
  const { ready, status, signedIn, space, signOut, retryStartup } = useSession()
  const { t } = useT()
  const segments = useSegments()

  useEffect(() => {
    if (!ready || status === "unavailable") return
    const area = segments[0]
    if (!signedIn) {
      if (area === "(member)" || area === "(staff)") router.replace("/(auth)/sign-in")
      return
    }
    const inSpace = space === "staff" ? area === "(staff)" : area === "(member)"
    if (area === "(auth)" || ((area === "(member)" || area === "(staff)") && !inSpace)) {
      router.replace(space === "staff" ? "/(staff)" : "/(member)")
    }
  }, [ready, status, signedIn, space, segments])

  if (!ready) return <LoadingState />
  if (status === "unavailable") {
    // Not signed out: the stored session is kept, so the user can retry or sign out explicitly.
    return (
      <View style={{ flex: 1 }}>
        <ErrorState message={t("final.api.network")} onRetry={retryStartup} />
        <View style={styles.center}><Button title={t("common.signOut")} onPress={() => void signOut()} /></View>
      </View>
    )
  }
  return <>{children}</>
}

