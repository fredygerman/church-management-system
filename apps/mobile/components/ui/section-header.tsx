import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, spacing, type } from "../../theme"
export type SectionHeaderProps = { title: string; actionLabel?: string; onAction?: () => void }
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) { return <View style={styles.row}><Text style={styles.title}>{title}</Text>{actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction}><Text style={styles.action}>{actionLabel}</Text></Pressable> : null}</View> }
const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }, title: { ...type.h3, color: colors.ink }, action: { ...type.supporting, color: colors.brand, fontWeight: "600" } })
