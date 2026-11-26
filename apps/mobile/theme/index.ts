import { Platform, type ViewStyle } from "react-native"

export const colors = {
  ink: "#172554",
  brand: "#1D4ED8",
  brandStrong: "#1E3A8A",
  accent: "#7C3AED",
  canvas: "#F8FAFC",
  surface: "#FFFFFF",
  tint: "#EEF2FF",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
  warning: "#A16207",
  danger: "#B91C1C",
} as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40, huge: 48, massive: 64 } as const
export const radii = { control: 8, card: 12, panel: 16, pill: 999 } as const
export const type = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "700" },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: "700" },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  supporting: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
} as const
export const shadow: ViewStyle = Platform.select({
  ios: { shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  android: { elevation: 2 },
  default: {},
}) ?? {}
