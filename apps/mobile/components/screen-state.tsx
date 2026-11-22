import { Button, StyleSheet, Text, View } from "react-native"

export function LoadingState() { return <View style={styles.center}><Text>Loading…</Text></View> }
export function EmptyState({ message }: { message: string }) { return <View style={styles.center}><Text>{message}</Text></View> }
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <View style={styles.center}><Text style={styles.error}>{message}</Text><Button title="Try again" onPress={onRetry} /></View> }
export const styles = StyleSheet.create({
  center: { alignItems: "center", flex: 1, gap: 14, justifyContent: "center", padding: 24 },
  error: { color: "#a21c1c", textAlign: "center" },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  heading: { fontSize: 19, fontWeight: "700", marginBottom: 8 },
  text: { color: "#4b5563", fontSize: 16, marginBottom: 18 },
})
