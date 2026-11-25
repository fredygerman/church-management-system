import { Link } from "expo-router"
import { Pressable, StyleSheet, Text } from "react-native"
import { useT } from "../../lib/locale"

export function AiHeaderButton() {
  const { t } = useT()
  return (
    <Link href="/ai" asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={t("final.mobile.ai.open")} style={styles.button}>
        <Text style={styles.label}>AI</Text>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  button: { marginRight: 16, paddingHorizontal: 8, paddingVertical: 4 },
  label: { color: "#1d4ed8", fontSize: 16, fontWeight: "600" },
})
