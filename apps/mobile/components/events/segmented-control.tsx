import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, radii, spacing, type } from "../../theme"

export type Segment<T extends string> = { key: T; label: string }

export function SegmentedControl<T extends string>({ segments, value, onChange }: { segments: Segment<T>[]; value: T; onChange: (key: T) => void }) {
  return <View accessibilityRole="tablist" style={styles.track}>
    {segments.map((segment) => {
      const selected = segment.key === value
      return <Pressable
        key={segment.key}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onPress={() => onChange(segment.key)}
        style={({ pressed }) => [styles.segment, selected ? styles.selected : styles.idle, pressed && { opacity: 0.85 }]}
      >
        <Text style={[styles.label, { color: selected ? colors.surface : colors.brandStrong }]}>{segment.label}</Text>
      </Pressable>
    })}
  </View>
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", gap: spacing.sm, padding: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.tint },
  segment: { flex: 1, minHeight: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  selected: { backgroundColor: colors.brand },
  idle: { backgroundColor: "transparent" },
  label: { ...type.body, fontWeight: "600" },
})
