import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, radii, spacing, type } from "../../theme"

export type SegmentedOption<T extends string> = { value: T; label: string }
export type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  accessibilityLabel: string
}

// Pill-shaped single choice control. Each option is a tab with a 44 px minimum target.
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.track}>
    {options.map(option => {
      const selected = option.value === value
      return <Pressable
        key={option.value}
        accessibilityRole="tab"
        accessibilityLabel={option.label}
        accessibilityState={{ selected }}
        onPress={() => onChange(option.value)}
        style={({ pressed }) => [styles.segment, selected ? styles.selected : styles.idle, pressed && styles.pressed]}
      >
        <Text style={[styles.label, { color: selected ? colors.surface : colors.brandStrong }]}>{option.label}</Text>
      </Pressable>
    })}
  </View>
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", gap: spacing.xs, padding: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.tint },
  segment: { flex: 1, minHeight: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  selected: { backgroundColor: colors.brand },
  idle: { backgroundColor: "transparent" },
  pressed: { opacity: 0.85 },
  label: { ...type.body, fontWeight: "600" },
})
