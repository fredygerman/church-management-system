import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radii, spacing, type } from "../../theme"

type Variant = "primary" | "secondary" | "ghost" | "destructive"
export type ButtonProps = { title: string; onPress: () => void; variant?: Variant; loading?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap; accessibilityLabel?: string }
export function Button({ title, onPress, variant = "primary", loading = false, disabled = false, icon, accessibilityLabel }: ButtonProps) {
  const inactive = disabled || loading
  const colorsByVariant: Record<Variant, { backgroundColor: string; color: string; borderColor?: string }> = {
    primary: { backgroundColor: colors.brand, color: colors.surface },
    secondary: { backgroundColor: colors.tint, color: colors.brand },
    ghost: { backgroundColor: "transparent", color: colors.brand },
    destructive: { backgroundColor: colors.danger, color: colors.surface },
  }
  const palette = colorsByVariant[variant]
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} disabled={inactive} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: palette.backgroundColor, opacity: inactive ? 0.55 : pressed ? 0.82 : 1 } as ViewStyle]}>
    {loading ? <ActivityIndicator color={palette.color} /> : <>{icon ? <Ionicons name={icon} size={18} color={palette.color} /> : null}<Text style={[styles.label, { color: palette.color }]}>{title}</Text></>}
  </Pressable>
}
const styles = StyleSheet.create({ button: { minHeight: 48, borderRadius: radii.card, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }, label: { ...type.body, fontWeight: "600" } })
