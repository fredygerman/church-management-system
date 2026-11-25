import { Button, Text, View } from "react-native"
import { LOCALES, type Locale } from "@church/config/i18n"
import { useT } from "../lib/locale"
import { styles } from "./screen-state"

const NAMES: Record<Locale, "language.en" | "language.sw"> = { en: "language.en", sw: "language.sw" }

/** Lets the user pick English or Kiswahili. The choice is kept on this device. */
export function LanguagePicker() {
  const { locale, t, setLocale } = useT()

  return (
    <View>
      <Text style={styles.formLabel}>{t("language.label")}</Text>
      {LOCALES.map((code) => (
        <Button
          key={code}
          title={code === locale ? `${t(NAMES[code])} ✓` : t(NAMES[code])}
          onPress={() => void setLocale(code)}
        />
      ))}
    </View>
  )
}
