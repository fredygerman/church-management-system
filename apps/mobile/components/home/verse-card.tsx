import { StyleSheet, Text, View } from "react-native"
import { colors, radii, spacing, type } from "../../theme"

export type VerseCardProps = { heading: string; text: string; reference: string }

/** Tinted verse card with a quote glyph. */
export function VerseCard({ heading, text, reference }: VerseCardProps) {
  return <View accessible accessibilityLabel={`${heading}: ${text} ${reference}`} style={styles.card}>
    <Text style={styles.heading}>{heading}</Text>
    <View style={styles.body}>
      <Text importantForAccessibility="no" style={styles.glyph}>{"“"}</Text>
      <View style={styles.copy}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.reference}>{`— ${reference}`}</Text>
      </View>
    </View>
  </View>
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.tint, borderColor: "#C7D2FE", borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  heading: { ...type.caption, color: colors.accent, fontWeight: "700", textTransform: "uppercase" },
  body: { flexDirection: "row", gap: spacing.sm },
  glyph: { fontSize: 44, lineHeight: 44, color: colors.accent, fontWeight: "700" },
  copy: { flex: 1, gap: spacing.xs },
  text: { ...type.body, color: colors.ink, fontStyle: "italic" },
  reference: { ...type.supporting, color: colors.brand, fontWeight: "600" },
})
