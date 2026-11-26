import { Link } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useT } from "../../lib/locale"
import { colors, radii, spacing, type } from "../../theme"

export function AiHeaderButton() {
  const { t } = useT()
  return (
    <Link href="/ai" asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={t("final.mobile.ai.open")} style={styles.button}>
        <View style={styles.content}><Ionicons name="sparkles" size={15} color={colors.accent} /><Text style={styles.label}>AI</Text></View>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  button: { marginRight: spacing.md, minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: "#EDE9FE" },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  label: { ...type.supporting, color: colors.accent, fontWeight: "700" },
})
