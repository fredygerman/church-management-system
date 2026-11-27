// Pure helper kept free of React Native imports so it can run under node --test.
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = Array.from(parts[0])[0] ?? ""
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : ""
  const value = (first + last).toUpperCase()
  return value.length > 0 ? value : "?"
}
