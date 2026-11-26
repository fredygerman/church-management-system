import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radii, spacing, type } from "../../theme"
import type { ServiceSchedule } from "./model"

// One recurring service: tint circle icon, name, and "Every Sunday · 9:00 AM".
export function ServiceRow({ service }: { service: ServiceSchedule }) {
  return <View accessibilityRole="text" style={styles.row}>
    <View style={styles.icon}><Ionicons name={service.icon} size={22} color={colors.brand} /></View>
    <View style={styles.copy}>
      <Text numberOfLines={2} style={styles.title}>{service.name}</Text>
      <Text style={styles.subtitle}>{service.subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
  </View>
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  icon: { width: 48, height: 48, borderRadius: radii.pill, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...type.body, color: colors.ink, fontWeight: "700" },
  subtitle: { ...type.supporting, color: colors.muted },
})
