import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Pill, type PillTone } from "../ui"
import { colors, radii, spacing, type } from "../../theme"
import { DateBlock } from "./date-block"
import { dayOfMonth, formatTimeRange, monthAbbrev } from "./format"
import type { EventRecord, RsvpStatus } from "./model"
import { useT } from "../../lib/locale"

export const RSVP_LABEL_KEYS = {
  going: "mobile.member.events.rsvp.going",
  maybe: "mobile.member.events.rsvp.maybe",
  declined: "mobile.member.events.rsvp.declined",
} as const

const RSVP_TONE: Record<RsvpStatus, PillTone> = { going: "success", maybe: "accent", declined: "default" }

export function EventCard({ event, rsvp, onPress }: { event: EventRecord; rsvp: RsvpStatus | null; onPress: () => void }) {
  const { t, locale } = useT()
  const title = event.title || t("mobile.member.events.fallbackTitle")
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
    <DateBlock month={monthAbbrev(event.startsAt, locale)} day={dayOfMonth(event.startsAt)} />
    <View style={styles.copy}>
      <Text numberOfLines={2} style={styles.title}>{title}</Text>
      {event.location ? <View style={styles.meta}><Ionicons name="location-outline" size={14} color={colors.muted} /><Text numberOfLines={1} style={styles.metaText}>{event.location}</Text></View> : null}
      <View style={styles.meta}><Ionicons name="time-outline" size={14} color={colors.muted} /><Text numberOfLines={1} style={styles.metaText}>{formatTimeRange(event.startsAt, event.endsAt)}</Text></View>
      {rsvp ? <View style={styles.pillRow}><Pill label={t(RSVP_LABEL_KEYS[rsvp])} tone={RSVP_TONE[rsvp]} /></View> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
  </Pressable>
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...type.body, color: colors.ink, fontWeight: "700" },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { ...type.supporting, color: colors.muted, flexShrink: 1 },
  pillRow: { marginTop: spacing.xs },
})
