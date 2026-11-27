import type { ReactNode } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { colors, radii, spacing, type } from "../../theme"

export type SheetProps = {
  visible: boolean
  onClose: () => void
  title: string
  children: ReactNode
  closeLabel: string
}

// Modal bottom sheet. Android back (onRequestClose) and the visible Close button both call onClose.
// Tapping the backdrop also closes, but it is not the only way out.
export function Sheet({ visible, onClose, title, children, closeLabel }: SheetProps) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false} importantForAccessibility="no" />
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}>
            <Text style={styles.closeText}>{"✕"}</Text>
          </Pressable>
        </View>
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  </Modal>
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  panel: { backgroundColor: colors.surface, borderTopLeftRadius: radii.panel, borderTopRightRadius: radii.panel, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md, maxHeight: "90%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  title: { ...type.h3, color: colors.ink, flex: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.pill, backgroundColor: colors.tint },
  closeText: { ...type.h3, color: colors.brandStrong },
  body: { gap: spacing.md },
})
