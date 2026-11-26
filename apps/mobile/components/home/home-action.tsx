import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radii, spacing, type } from "../../theme"

export type HomeActionProps = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }

/** Compact quick-action tile sized for a four-across row on small phones. */
export function HomeAction({ icon, label, onPress }: HomeActionProps) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.82 }]}>
    <View style={styles.icon} importantForAccessibility="no">
      <Ionicons name={icon} size={22} color={colors.brand} />
    </View>
    <Text style={styles.label}>{label}</Text>
  </Pressable>
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  icon: { width: 48, height: 48, borderRadius: radii.pill, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" },
  label: { ...type.caption, color: colors.ink, fontWeight: "600", textAlign: "center" },
})
