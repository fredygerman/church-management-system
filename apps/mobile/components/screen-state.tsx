import { StyleSheet, Text, View } from "react-native"
import { useT } from "../lib/locale"
import { colors, spacing, type } from "../theme"
import { Button } from "./ui"

export function LoadingState() { const { t } = useT(); return <View style={styles.center}><Text style={styles.text}>{t("common.loading")}</Text></View> }
export function EmptyState({ message }: { message: string }) { return <View style={styles.center}><Text style={styles.text}>{message}</Text></View> }
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { const { t } = useT(); return <View style={styles.center}><Text style={styles.error}>{message}</Text><Button title={t("common.retry")} onPress={onRetry} /></View> }
export const styles = StyleSheet.create({
  center: { alignItems: "center", backgroundColor: colors.canvas, flex: 1, gap: spacing.md, justifyContent: "center", padding: spacing.xl },
  error: { ...type.body, color: colors.danger, textAlign: "center" },
  content: { flex: 1, backgroundColor: colors.canvas, padding: spacing.xl },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.sm },
  heading: { ...type.h3, color: colors.ink, marginBottom: spacing.sm },
  text: { ...type.body, color: colors.muted, marginBottom: spacing.md, textAlign: "center" },
  card: { borderBottomColor: colors.border, borderBottomWidth: 1, marginBottom: spacing.lg, paddingBottom: spacing.xs },
  input: { borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.ink, ...type.body, marginBottom: spacing.md, padding: spacing.md },
  multilineInput: { minHeight: 130, textAlignVertical: "top" },
  formLabel: { ...type.body, color: colors.ink, fontWeight: "600", marginBottom: spacing.xs },
  success: { color: colors.success, marginBottom: spacing.md },
})
