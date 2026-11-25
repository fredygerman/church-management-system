import { Button, StyleSheet, Text, View } from "react-native"
import { useT } from "../lib/locale"

export function LoadingState() { const { t } = useT(); return <View style={styles.center}><Text>{t("common.loading")}</Text></View> }
export function EmptyState({ message }: { message: string }) { return <View style={styles.center}><Text>{message}</Text></View> }
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { const { t } = useT(); return <View style={styles.center}><Text style={styles.error}>{message}</Text><Button title={t("common.retry")} onPress={onRetry} /></View> }
export const styles = StyleSheet.create({
  center: { alignItems: "center", flex: 1, gap: 14, justifyContent: "center", padding: 24 },
  error: { color: "#a21c1c", textAlign: "center" },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  heading: { fontSize: 19, fontWeight: "700", marginBottom: 8 },
  text: { color: "#4b5563", fontSize: 16, marginBottom: 18 },
  card: { borderBottomColor: "#e5e7eb", borderBottomWidth: 1, marginBottom: 18, paddingBottom: 6 },
  input: { borderColor: "#9ca3af", borderRadius: 6, borderWidth: 1, fontSize: 16, marginBottom: 12, padding: 12 },
  multilineInput: { minHeight: 130, textAlignVertical: "top" },
  formLabel: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  success: { color: "#166534", marginBottom: 14 },
})
