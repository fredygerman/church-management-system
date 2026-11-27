import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, spacing, type } from "../../theme"
import { Button } from "./button"

export type EmptyStateProps = {
  title: string
  body?: string
  icon?: keyof typeof Ionicons.glyphMap
  action?: { label: string; onPress: () => void }
}

// Explains an empty list and offers the next step when there is one.
export function EmptyState({ title, body, icon, action }: EmptyStateProps) {
  return <View style={styles.wrap}>
    {icon ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icon} size={32} color={colors.brand} /></View> : null}
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    {body ? <Text style={styles.body}>{body}</Text> : null}
    {action ? <View style={styles.action}><Button title={action.label} variant="secondary" onPress={action.onPress} /></View> : null}
  </View>
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  title: { ...type.h3, color: colors.ink, textAlign: "center" },
  body: { ...type.supporting, color: colors.muted, textAlign: "center" },
  action: { alignSelf: "stretch", marginTop: spacing.sm },
})
