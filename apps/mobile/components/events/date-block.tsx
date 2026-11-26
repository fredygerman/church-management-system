import { StyleSheet, Text, View } from "react-native"
import { colors, radii, type } from "../../theme"

// Month abbreviation over the day number, in a tint square. `inverse` is for brand-coloured heroes.
export function DateBlock({ month, day, inverse = false, size = 56 }: { month: string; day: string; inverse?: boolean; size?: number }) {
  return <View style={[styles.block, { width: size, minHeight: size, backgroundColor: inverse ? colors.surface : colors.tint }]}>
    <Text style={[styles.month, { color: colors.brand }]}>{month.toUpperCase()}</Text>
    <Text style={[styles.day, { color: colors.ink }]}>{day}</Text>
  </View>
}

const styles = StyleSheet.create({
  block: { alignItems: "center", justifyContent: "center", borderRadius: radii.card, paddingVertical: 6 },
  month: { ...type.caption, fontWeight: "700", letterSpacing: 0.5 },
  day: { fontSize: 22, lineHeight: 26, fontWeight: "700" },
})
