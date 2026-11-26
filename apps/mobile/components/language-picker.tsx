import { Pressable, Text, View } from "react-native"
import { LOCALES, type Locale } from "@church/config/i18n"
import { useT } from "../lib/locale"
import { styles } from "./screen-state"
import { colors, radii, spacing, type } from "../theme"

const NAMES: Record<Locale, "language.en" | "language.sw"> = { en: "language.en", sw: "language.sw" }

/** Lets the user pick English or Kiswahili. The choice is kept on this device. */
export function LanguagePicker() {
  const { locale, t, setLocale } = useT()

  return (
    <View>
      <Text style={styles.formLabel}>{t("language.label")}</Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", padding: 4, backgroundColor: colors.tint, borderRadius: radii.pill, gap: spacing.xs }}>
        {LOCALES.map((code) => <Pressable key={code} accessibilityRole="radio" accessibilityState={{ selected: code === locale }} onPress={() => void setLocale(code)} style={{ minHeight: 44, flex: 1, borderRadius: radii.pill, backgroundColor: code === locale ? colors.surface : "transparent", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md }}><Text style={{ ...type.supporting, color: code === locale ? colors.brandStrong : colors.muted, fontWeight: code === locale ? "700" : "500" }}>{code === locale ? `${t(NAMES[code])} ✓` : t(NAMES[code])}</Text></Pressable>)}
      </View>
    </View>
  )
}
