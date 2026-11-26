import { StyleSheet, Text, View } from "react-native"
import type { ReactNode } from "react"
import { colors, radii, spacing, type } from "../../theme"
export type HeroBannerProps = { title: string; subtitle?: string; children?: ReactNode }
export function HeroBanner({ title, subtitle, children }: HeroBannerProps) { return <View style={styles.hero}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}{children}</View> }
const styles = StyleSheet.create({ hero: { backgroundColor: colors.brandStrong, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, padding: spacing.xl, gap: spacing.sm }, title: { ...type.h1, color: colors.surface }, subtitle: { ...type.body, color: "#E0E7FF" } })
