import { StyleSheet, View, type DimensionValue } from "react-native"
import { colors, radii } from "../../theme"

export type SkeletonProps = { width?: DimensionValue; height: number; radius?: number }

// Static loading placeholder. Hidden from assistive tech; pair it with a screen-level loading announcement.
export function Skeleton({ width = "100%", height, radius = radii.card }: SkeletonProps) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.block, { width, height, borderRadius: radius }]} />
}

const styles = StyleSheet.create({ block: { backgroundColor: colors.tint } })
