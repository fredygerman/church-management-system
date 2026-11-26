import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radii, spacing, type } from "../../theme"

export type HomeHeroProps = { greeting: string; roleLine: string; churchName: string }

/** Brand hero with a greeting, role line and a display-only church indicator. */
export function HomeHero({ greeting, roleLine, churchName }: HomeHeroProps) {
  return <View style={styles.hero}>
    {/* Decorative only: two translucent overlapping circles, no imagery. */}
    <View importantForAccessibility="no" accessible={false} style={styles.circleIndigo} />
    <View importantForAccessibility="no" accessible={false} style={styles.circleViolet} />
    <Text accessibilityRole="header" style={styles.greeting}>{greeting}</Text>
    <Text style={styles.role}>{roleLine}</Text>
    <View accessible accessibilityLabel={churchName} style={styles.church}>
      <Ionicons name="location-outline" size={16} color={colors.brandStrong} />
      <Text numberOfLines={1} style={styles.churchText}>{churchName}</Text>
    </View>
  </View>
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brandStrong, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 72, gap: spacing.sm, overflow: "hidden" },
  circleIndigo: { position: "absolute", width: 240, height: 240, borderRadius: 120, top: -90, right: -70, backgroundColor: "rgba(129, 140, 248, 0.28)" },
  circleViolet: { position: "absolute", width: 170, height: 170, borderRadius: 85, top: 40, right: 60, backgroundColor: "rgba(124, 58, 237, 0.22)" },
  greeting: { ...type.display, color: colors.surface },
  role: { ...type.supporting, color: "#E0E7FF" },
  church: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.md, backgroundColor: colors.surface, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, maxWidth: "100%" },
  churchText: { ...type.supporting, color: colors.brandStrong, fontWeight: "600", flexShrink: 1 },
})
