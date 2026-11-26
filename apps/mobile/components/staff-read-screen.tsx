import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ScrollView, Text, View } from "react-native"
import { ApiError } from "../lib/api"
import { createRequestGate } from "../lib/request-gate"
import { useT } from "../lib/locale"
import { useSession } from "../lib/session"
import { NotConnectedState } from "./not-connected-state"
import { EmptyState, ErrorState, LoadingState, styles } from "./screen-state"

export type StaffRow = Record<string, unknown>

export function asRows(data: unknown): StaffRow[] {
  return Array.isArray(data) ? (data as StaffRow[]) : []
}

export function field(row: StaffRow, key: string, fallback = "") {
  const value = row[key]
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback
}

type ScreenState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "denied" }
  | { status: "not-connected" }
  | { status: "error"; message: string }

type StaffReadScreenProps<T> = {
  area: string
  emptyMessage: string
  isEmpty: (data: T) => boolean
  load: () => Promise<T>
  children: (data: T) => ReactNode
}

// Read-only: loads one or more GET endpoints and renders loading, not-connected,
// denied (server 403 for a missing permission key), error-with-retry, and empty states.
// Reloads on every context change (church, role, sign-in); a response from an earlier context is discarded.
export function StaffReadScreen<T>({ area, emptyMessage, isEmpty, load, children }: StaffReadScreenProps<T>) {
  const { t } = useT()
  const { contextKey } = useSession()
  const gate = useRef(createRequestGate()).current
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ScreenState<T>>({ status: "loading" })

  useEffect(() => {
    const isCurrent = gate.start()
    setState({ status: "loading" })
    load().then(
      (data) => { if (isCurrent()) setState({ status: "ready", data }) },
      (caught: unknown) => {
        if (!isCurrent()) return
        if (caught instanceof ApiError && caught.kind === "not-configured") setState({ status: "not-connected" })
        else if (caught instanceof ApiError && caught.status === 403) setState({ status: "denied" })
        else setState({ status: "error", message: caught instanceof ApiError ? caught.message : t("mobile.staff.readScreen.loadError", { area: area.toLowerCase() }) })
      },
    )
    return () => gate.invalidate()
  }, [load, contextKey, attempt, area, t, gate])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  if (state.status === "loading") return <LoadingState />
  if (state.status === "not-connected") return <NotConnectedState area={area} />
  if (state.status === "denied") {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>{t("mobile.staff.readScreen.unavailable", { area })}</Text>
        <Text style={styles.text}>{t("mobile.staff.readScreen.noPermission")}</Text>
      </View>
    )
  }
  if (state.status === "error") return <ErrorState message={state.message} onRetry={retry} />
  if (isEmpty(state.data)) return <EmptyState message={emptyMessage} />
  return <ScrollView contentContainerStyle={styles.content}>{children(state.data)}</ScrollView>
}
