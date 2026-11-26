import { Pressable, StyleSheet, View, type ViewStyle, type StyleProp } from "react-native"
import type { ReactNode } from "react"
import { colors, radii, spacing } from "../../theme"
export type CardProps = { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }
export function Card({ children, style, onPress }: CardProps) { const content = <View style={[styles.card, style]}>{children}</View>; return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed ? { opacity: 0.85 } : undefined}>{content}</Pressable> : content }
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.card, padding: spacing.lg } })
