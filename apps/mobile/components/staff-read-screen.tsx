import { useCallback, useEffect, useState, type ReactNode } from "react"
import { ScrollView, Text, View } from "react-native"
import { ApiError } from "../lib/api"
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
export function StaffReadScreen<T>({ area, emptyMessage, isEmpty, load, children }: StaffReadScreenProps<T>) {
  const [state, setState] = useState<ScreenState<T>>({ status: "loading" })

  const run = useCallback(async () => {
    setState({ status: "loading" })
    try {
      setState({ status: "ready", data: await load() })
    } catch (caught) {
      if (caught instanceof ApiError && caught.kind === "not-configured") setState({ status: "not-connected" })
      else if (caught instanceof ApiError && caught.status === 403) setState({ status: "denied" })
      else setState({ status: "error", message: caught instanceof ApiError ? caught.message : `Unable to load ${area.toLowerCase()}.` })
    }
  }, [area, load])

  useEffect(() => { void run() }, [run])

  if (state.status === "loading") return <LoadingState />
  if (state.status === "not-connected") return <NotConnectedState area={area} />
  if (state.status === "denied") {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>{area} is not available</Text>
        <Text style={styles.text}>Your account does not have permission to view this area.</Text>
      </View>
    )
  }
  if (state.status === "error") return <ErrorState message={state.message} onRetry={() => void run()} />
  if (isEmpty(state.data)) return <EmptyState message={emptyMessage} />
  return <ScrollView contentContainerStyle={styles.content}>{children(state.data)}</ScrollView>
}
