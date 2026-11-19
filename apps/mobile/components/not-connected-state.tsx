import { StyleSheet, Text, View } from "react-native"

type NotConnectedStateProps = {
  area: string
}

export function NotConnectedState({ area }: NotConnectedStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{area}</Text>
      <Text style={styles.message}>This screen is not yet connected.</Text>
      <Text style={styles.detail}>
        No church data or metrics are available in this M0 preview.
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
