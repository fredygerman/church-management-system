import { StyleSheet, Text, View } from "react-native"
import { useT } from "../lib/locale"

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
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
  },
  detail: {
    color: "#5f6368",
    fontSize: 14,
    textAlign: "center",
  },
})
