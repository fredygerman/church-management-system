// Tanzanian mobile numbers (RM-030). Only +255 numbers starting with 6 or 7 are accepted.

const LOCAL_MOBILE = /^[67]\d{8}$/

/**
 * Normalise a Tanzanian mobile number to E.164 (+255XXXXXXXXX).
 * Accepts 0712345678, 255712345678, +255 712 345 678 and dashes or dots as separators.
 * Returns null for anything else, including bare 9-digit numbers without a prefix.
 */
export function normalizeTzPhone(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  if (trimmed === "") return null

  const hasPlus = trimmed.startsWith("+")
  const digitsOnly = trimmed.replace(/[\s\-.()]/g, "")
  const body = hasPlus ? digitsOnly.slice(1) : digitsOnly
  if (!/^\d+$/.test(body)) return null

  let local: string
  if (hasPlus) {
    if (!body.startsWith("255")) return null
    local = body.slice(3)
  } else if (body.startsWith("255")) {
    local = body.slice(3)
  } else if (body.startsWith("0")) {
    local = body.slice(1)
  } else {
    return null
  }

  return LOCAL_MOBILE.test(local) ? `+255${local}` : null
}

/** Mask all but the last three digits for display and logs, for example +255******678. */
export function maskPhone(e164: string): string {
  if (e164.length <= 7) return "***"
  return `${e164.slice(0, 4)}${"*".repeat(e164.length - 7)}${e164.slice(-3)}`
}
