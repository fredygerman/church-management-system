import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Locale, Translate } from "@church/config/i18n"
import { Card } from "../ui"
import { colors, radii, spacing, type } from "../../theme"
import { darDateParts, formatRelativeDar } from "./dar-time"

export type UpcomingItem = { title: string; place: string | null; at: Date; showTime: boolean; route: string }

/** Next service or event: date block, title, place, time and a chevron. */
export function UpcomingCard({ item, locale, onPress }: { item: UpcomingItem; locale: Locale; onPress: () => void }) {
  const parts = darDateParts(item.at, locale)
  const details = [item.place, item.showTime ? parts.time : null].filter(Boolean).join(" · ")
  return <Card onPress={onPress} style={styles.upcoming}>
    <View style={styles.row}>
      <View style={styles.dateBlock} importantForAccessibility="no">
        <Text style={styles.dateMonth}>{parts.month}</Text>
        <Text style={styles.dateDay}>{parts.day}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        {details ? <Text numberOfLines={2} style={styles.meta}>{details}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </View>
  </Card>
}

export type AnnouncementItem = { id: string; title: string; excerpt: string; sentAt: Date | null }

/** Recent announcement: title, two-line body excerpt and relative date. */
export function AnnouncementCard({ item, locale, now, t }: { item: AnnouncementItem; locale: Locale; now: Date; t: Translate }) {
  const when = item.sentAt ? formatRelativeDar(item.sentAt, now, locale, t) : ""
  return <Card style={styles.announcement}>
    <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
    {item.excerpt ? <Text numberOfLines={2} style={styles.excerpt}>{item.excerpt}</Text> : null}
    {when ? <Text style={styles.caption}>{when}</Text> : null}
  </Card>
}

const styles = StyleSheet.create({
  upcoming: { paddingVertical: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dateBlock: { width: 56, minHeight: 56, borderRadius: radii.card, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" },
  dateMonth: { ...type.caption, color: colors.brand, fontWeight: "700", textTransform: "uppercase" },
  dateDay: { ...type.h3, color: colors.ink },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...type.body, color: colors.ink, fontWeight: "600" },
  meta: { ...type.supporting, color: colors.muted },
  announcement: { gap: spacing.xs },
  excerpt: { ...type.supporting, color: colors.muted },
  caption: { ...type.caption, color: colors.brand, fontWeight: "600", marginTop: spacing.xs },
})
