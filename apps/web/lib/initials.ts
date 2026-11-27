/**
 * Builds up to two uppercase initials from a display name ("Grace Wanjiru" -> "GW").
 * Returns `fallback` when the name has no letters.
 */
export function getInitials(name: string | null | undefined, fallback = "?"): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return fallback

  const first = Array.from(words[0])[0] ?? ""
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : ""
  return (first + last).toUpperCase() || fallback
}
