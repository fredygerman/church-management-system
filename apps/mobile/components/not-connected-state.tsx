import { StyleSheet, Text, View } from "react-native"
import { useT } from "../lib/locale"
import { colors, spacing, type } from "../theme"

type NotConnectedStateProps = {
  area: string
}

export function NotConnectedState({ area }: NotConnectedStateProps) {
  const { t } = useT()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{area}</Text>
      <Text style={styles.message}>{t("mobile.shared.notConnected.message")}</Text>
      <Text style={styles.detail}>
        {t("mobile.shared.notConnected.detail")}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
    backgroundColor: colors.canvas,
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    ...type.h2,
    color: colors.ink,
    textAlign: "center",
  },
  message: {
    ...type.body,
    color: colors.ink,
    textAlign: "center",
  },
  detail: {
    ...type.supporting,
    color: colors.muted,
    textAlign: "center",
  },
})
