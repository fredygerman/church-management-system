import { Link } from "expo-router"
import { StyleSheet, Text, View } from "react-native"

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mito Ya Baraka Church</Text>
      <Text style={styles.message}>Sign-in is not yet connected.</Text>
      <Text style={styles.detail}>
        Authentication and church data will be added after the M0 foundation.
      </Text>
      <Link href="/(member)" style={styles.link}>
        Preview member space
      </Link>
      <Link href="/(staff)" style={styles.link}>
        Preview staff space
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
  },
  detail: {
    color: "#5f6368",
    fontSize: 14,
    maxWidth: 320,
    textAlign: "center",
  },
  link: {
    color: "#2457c5",
    fontSize: 16,
    fontWeight: "600",
    padding: 8,
  },
})
