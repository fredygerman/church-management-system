// Pure helpers for the church join code. No React Native imports, so the node test can load this file directly.

export const JOIN_CODE_MIN_LENGTH = 6
export const JOIN_CODE_MAX_LENGTH = 12

/**
 * Normalises what the user typed or pasted: spaces and hyphens are dropped (so "k7mq-4xwd" works),
 * letters are uppercased, and the result is capped at the maximum length.
 */
export function normalizeJoinCode(input: string): string {
  return input.replace(/[\s-]+/g, "").toUpperCase().slice(0, JOIN_CODE_MAX_LENGTH)
}

/** True when a normalised code has 6 to 12 letters or digits. */
export function isValidJoinCode(code: string): boolean {
  return new RegExp(`^[A-Z0-9]{${JOIN_CODE_MIN_LENGTH},${JOIN_CODE_MAX_LENGTH}}$`).test(code)
}
