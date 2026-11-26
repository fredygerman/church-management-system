import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radii, spacing, type } from "../../theme"
export type QuickActionProps = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }
export function QuickAction({ icon, label, onPress }: QuickActionProps) { return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.82 }]}><View style={styles.icon}><Ionicons name={icon} size={22} color={colors.brand} /></View><Text style={styles.label}>{label}</Text></Pressable> }
const styles = StyleSheet.create({ tile: { minHeight: 96, minWidth: 96, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.md }, icon: { width: 48, height: 48, backgroundColor: colors.tint, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" }, label: { ...type.supporting, color: colors.ink, textAlign: "center" } })
