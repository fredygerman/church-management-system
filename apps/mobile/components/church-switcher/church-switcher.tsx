import { router } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { MessageKey, Translate } from "@church/config/i18n"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"
import { createRequestGate } from "../../lib/request-gate"
import { colors, radii, spacing, type } from "../../theme"
import { Button, ListRow, Pill } from "../ui"
import { listMemberships, type ChurchMembership } from "./church-api"

const ROLE_KEYS: Record<string, MessageKey> = {
  super_admin: "switcher.role.super_admin",
  admin: "switcher.role.admin",
  branch_admin: "switcher.role.branch_admin",
  zone_leader: "switcher.role.zone_leader",
  member: "switcher.role.member",
  usher: "switcher.role.usher",
  publisher: "switcher.role.publisher",
}

function roleLabel(role: string, t: Translate): string {
  const key = ROLE_KEYS[role]
  return key ? t(key) : t("switcher.role.other")
}

export type ChurchSwitcherProps = {
  /** Called after the session has switched to the chosen church and refreshed. */
  onSwitched?: (churchId: string) => void
  style?: StyleProp<ViewStyle>
}

type ListState = { status: "loading" } | { status: "ready"; churches: ChurchMembership[] } | { status: "error" }

/**
 * The user's churches: the active one is marked, the others switch on tap, and "Add another church" opens /join.
 * Reloads whenever the session context changes, so no row is stale after a switch.
 */
export function ChurchSwitcher({ onSwitched, style }: ChurchSwitcherProps) {
  const { t } = useT()
  const { contextKey, user, switchChurch } = useSession()
  const activeChurchId = user?.activeChurchId ?? null
  const [list, setList] = useState<ListState>({ status: "loading" })
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [switchFailed, setSwitchFailed] = useState(false)
  const gate = useRef(createRequestGate()).current

  const load = useCallback(async () => {
    const isCurrent = gate.start()
    setList({ status: "loading" })
    try {
      const churches = await listMemberships()
      if (isCurrent()) setList({ status: "ready", churches })
    } catch {
      if (isCurrent()) setList({ status: "error" })
    }
  }, [gate])

  // contextKey is a trigger: a new user, church or role means the list must be fetched again.
  useEffect(() => {
    void load()
    return () => gate.invalidate()
  }, [contextKey, load, gate])

  async function switchTo(churchId: string) {
    if (switchingId || churchId === activeChurchId) return
    setSwitchingId(churchId)
    setSwitchFailed(false)
    try {
      await switchChurch(churchId)
      onSwitched?.(churchId)
    } catch {
      setSwitchFailed(true)
    } finally {
      setSwitchingId(null)
    }
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{t("switcher.title")}</Text>

      {list.status === "loading" ? <Text style={styles.muted}>{t("common.loading")}</Text> : null}

      {list.status === "error" ? (
        <View style={styles.stack}>
          <Text style={styles.danger}>{t("switcher.error.load")}</Text>
          <Button title={t("common.retry")} variant="secondary" onPress={() => void load()} />
        </View>
      ) : null}

      {list.status === "ready" ? list.churches.map((church) => {
        const active = church.churchId === activeChurchId
        const busy = switchingId === church.churchId
        return (
          <Pressable
            key={church.churchId}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: active || switchingId !== null, busy }}
            disabled={active || switchingId !== null}
            onPress={() => void switchTo(church.churchId)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.copy}>
              <Text style={styles.churchName}>{church.churchName}</Text>
              <Text style={styles.muted}>{roleLabel(church.role, t)}</Text>
            </View>
            {active ? <Pill label={t("switcher.active")} tone="success" /> : (
              <View style={styles.switchAction}>
                <Text style={styles.switchText}>{busy ? t("common.loading") : t("switcher.switchTo")}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.brand} />
              </View>
            )}
          </Pressable>
        )
      }) : null}

      {switchFailed ? <Text accessibilityLiveRegion="polite" style={styles.danger}>{t("switcher.error.switch")}</Text> : null}

      <ListRow
        icon="add-circle-outline"
        title={t("switcher.addChurch")}
        onPress={() => router.push("/join")}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { ...type.h3, color: colors.ink },
  stack: { gap: spacing.sm },
  muted: { ...type.supporting, color: colors.muted },
  danger: { ...type.supporting, color: colors.danger },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 56, paddingVertical: spacing.sm, borderRadius: radii.card },
  pressed: { opacity: 0.82 },
  copy: { flex: 1, gap: spacing.xs },
  churchName: { ...type.body, color: colors.ink, fontWeight: "600" },
  switchAction: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  switchText: { ...type.supporting, color: colors.brand, fontWeight: "600" },
})
