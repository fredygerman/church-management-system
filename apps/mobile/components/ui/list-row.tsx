import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { ReactNode } from "react"
import { colors, radii, spacing, type } from "../../theme"
export type ListRowProps = { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void; trailing?: ReactNode }
export function ListRow({ icon, title, subtitle, onPress, trailing }: ListRowProps) { return <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.82 }]}><View style={styles.icon}><Ionicons name={icon} size={20} color={colors.brand} /></View><View style={styles.copy}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{trailing ?? <Ionicons name="chevron-forward" size={18} color={colors.muted} />}</Pressable> }
const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 56 }, icon: { width: 40, height: 40, borderRadius: radii.pill, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" }, copy: { flex: 1 }, title: { ...type.body, color: colors.ink, fontWeight: "600" }, subtitle: { ...type.supporting, color: colors.muted } })
