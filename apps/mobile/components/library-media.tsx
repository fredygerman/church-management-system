import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Pill } from "./ui"
import { colors, radii, spacing, type } from "../theme"

// Media-style library pieces. Covers are drawn with views and icons only: no photos are shipped or fetched.
export type MediaKind = "document" | "book" | "sermon" | "audio" | "video"

const TONES: Record<MediaKind, { background: string; foreground: string; icon: keyof typeof Ionicons.glyphMap }> = {
  document: { background: colors.tint, foreground: colors.brand, icon: "document-text-outline" },
  book: { background: "#ECFDF5", foreground: "#047857", icon: "book-outline" },
  sermon: { background: "#EDE9FE", foreground: colors.accent, icon: "mic-outline" },
  audio: { background: "#FFF7ED", foreground: "#C2410C", icon: "musical-notes-outline" },
  video: { background: "#FEF2F2", foreground: colors.danger, icon: "videocam-outline" },
}

export function mediaKindForContentType(contentType: string): MediaKind {
  if (contentType.startsWith("audio/")) return "audio"
  if (contentType.startsWith("video/")) return "video"
  return "document"
}

export function LibraryCover({ kind, label, large = false }: { kind: MediaKind; label: string; large?: boolean }) {
  const tone = TONES[kind]
  return <View accessible={false} style={[styles.cover, large ? styles.coverLarge : styles.coverSmall, { backgroundColor: tone.background }]}>
    <Ionicons name={tone.icon} size={large ? 52 : 28} color={tone.foreground} />
    <Text numberOfLines={1} style={[styles.coverLabel, { color: tone.foreground }]}>{label}</Text>
  </View>
}

export type LibraryMediaRowProps = {
  kind: MediaKind
  title: string
  subtitle?: string
  coverLabel: string
  pillLabel: string
  accessLabel: string
  busy?: boolean
  busyLabel?: string
  disabled?: boolean
  error?: string
  onPress: () => void
}

export function LibraryMediaRow({ kind, title, subtitle, coverLabel, pillLabel, accessLabel, busy = false, busyLabel, disabled = false, error, onPress }: LibraryMediaRowProps) {
  return <Pressable
    accessibilityLabel={title}
    accessibilityRole="button"
    accessibilityState={{ busy, disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.85 }]}
  >
    <Card style={styles.card}>
      <View style={styles.row}>
        <LibraryCover kind={kind} label={coverLabel} />
        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.title}>{title}</Text>
          {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.pills}>
            <Pill label={pillLabel} />
            <Pill label={accessLabel} tone="success" />
          </View>
        </View>
        {busy
          ? <ActivityIndicator accessibilityLabel={busyLabel} color={colors.brand} />
          : <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </Card>
  </Pressable>
}

export function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onPress}
    style={[styles.chip, { backgroundColor: selected ? colors.brand : colors.tint }]}
  >
    <Text style={[styles.chipLabel, { color: selected ? colors.surface : colors.brand }]}>{label}</Text>
  </Pressable>
}

const styles = StyleSheet.create({
  pressable: { marginBottom: spacing.md, minHeight: 44 },
  card: { marginBottom: 0 },
  row: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...type.body, color: colors.ink, fontWeight: "700" },
  subtitle: { ...type.supporting, color: colors.muted },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  error: { ...type.supporting, color: colors.danger, marginTop: spacing.sm },
  cover: { alignItems: "center", borderRadius: radii.card, gap: spacing.xs, justifyContent: "center", paddingHorizontal: spacing.xs },
  coverSmall: { height: 84, width: 72 },
  coverLarge: { height: 180, width: "100%" },
  coverLabel: { ...type.caption, fontWeight: "700", maxWidth: "100%" },
  chip: { minHeight: 40, borderRadius: radii.pill, justifyContent: "center", paddingHorizontal: spacing.lg },
  chipLabel: { ...type.supporting, fontWeight: "600" },
})
