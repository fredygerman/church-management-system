import { useEffect, useState } from "react"
import { Image, StyleSheet, Text, View } from "react-native"
import { colors, type } from "../../theme"
import { initialsFor } from "./initials"

export type AvatarSize = "sm" | "md" | "lg"
export type AvatarProps = { uri?: string | null; name: string; size?: AvatarSize }

const DIAMETER: Record<AvatarSize, number> = { sm: 32, md: 44, lg: 64 }

// Shows the photo when one is given and loads; otherwise (no uri, or load error) shows initials.
export function Avatar({ uri, name, size = "md" }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [uri])
  const diameter = DIAMETER[size]
  const box = { width: diameter, height: diameter, borderRadius: diameter / 2 }
  const showPhoto = Boolean(uri) && !failed

  return <View accessible accessibilityRole="image" accessibilityLabel={name} style={[styles.box, box]}>
    {showPhoto ? <Image source={{ uri: uri as string }} style={[styles.fill, box]} onError={() => setFailed(true)} accessibilityIgnoresInvertColors />
      : <Text importantForAccessibility="no" style={[styles.initials, { fontSize: Math.round(diameter * 0.38), lineHeight: Math.round(diameter * 0.5) }]}>{initialsFor(name)}</Text>}
  </View>
}

const styles = StyleSheet.create({
  box: { overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.tint },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  initials: { ...type.supporting, color: colors.brandStrong, fontWeight: "600" },
})
