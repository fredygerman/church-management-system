import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native"
import { colors, radii, spacing, type } from "../../theme"

export type ToastTone = "default" | "success" | "danger"
export type ToastApi = { show: (message: string, tone?: ToastTone) => void }

const ToastContext = createContext<ToastApi | null>(null)
export const TOAST_DURATION_MS = 4000

type ActiveToast = { id: number; message: string; tone: ToastTone }
const TONE_COLORS: Record<ToastTone, { background: string; text: string }> = {
  default: { background: colors.ink, text: colors.surface },
  success: { background: colors.success, text: colors.surface },
  danger: { background: colors.danger, text: colors.surface },
}

// Shows one transient message at a time. Each message is announced to screen readers once.
export function ToastProvider({ children, durationMs = TOAST_DURATION_MS }: { children: ReactNode; durationMs?: number }) {
  const [active, setActive] = useState<ActiveToast | null>(null)
  const nextId = useRef(0)

  const show = useCallback((message: string, tone: ToastTone = "default") => {
    nextId.current += 1
    setActive({ id: nextId.current, message, tone })
    AccessibilityInfo.announceForAccessibility(message)
  }, [])

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setActive(current => (current?.id === active.id ? null : current)), durationMs)
    return () => clearTimeout(timer)
  }, [active, durationMs])

  const api = useMemo<ToastApi>(() => ({ show }), [show])
  const palette = active ? TONE_COLORS[active.tone] : null

  return <ToastContext.Provider value={api}>
    {children}
    {active && palette ? <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.host}>
      <View style={[styles.toast, { backgroundColor: palette.background }]}>
        <Text style={[styles.message, { color: palette.text }]}>{active.message}</Text>
      </View>
    </View> : null}
  </ToastContext.Provider>
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error("useToast must be used inside ToastProvider")
  return api
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.xxl, alignItems: "center" },
  toast: { maxWidth: 560, width: "100%", borderRadius: radii.card, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  message: { ...type.supporting, fontWeight: "600", textAlign: "center" },
})
