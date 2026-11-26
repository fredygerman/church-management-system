import { StyleSheet, Text, View } from "react-native"
import { colors, radii, spacing, type } from "../../theme"
export type PillTone = "default" | "success" | "warning" | "danger" | "accent"
export type PillProps = { label: string; tone?: PillTone }
export function Pill({ label, tone = "default" }: PillProps) { const palette = tone === "success" ? ["#DCFCE7", colors.success] : tone === "warning" ? ["#FEF3C7", colors.warning] : tone === "danger" ? ["#FEE2E2", colors.danger] : tone === "accent" ? ["#EDE9FE", colors.accent] : [colors.tint, colors.brand]; return <View style={[styles.pill, { backgroundColor: palette[0] }]}><Text style={[styles.label, { color: palette[1] }]}>{label}</Text></View> }
const styles = StyleSheet.create({ pill: { alignSelf: "flex-start", borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, label: { ...type.caption, fontWeight: "600" } })
