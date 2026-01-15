/**
 * Date Helper Utilities
 * 
 * ⚠️ IMPORTANT: Always use these helpers when working with date fields in the database.
 * PostgreSQL date type expects YYYY-MM-DD format, not timestamps.
 * 
 * These helpers are reusable across frontend and backend.
 * 
 * Usage:
 * - toDateString(new Date()) → "2026-01-15"
 * - toDateString("2026-01-15") → "2026-01-15" (passthrough)
 */

/**
 * Convert Date or string to PostgreSQL date format (YYYY-MM-DD)
 * @param date - Date object or date string
 * @returns Date string in YYYY-MM-DD format, or null if no date provided
 * 
 * @example
 * toDateString(new Date()) // "2026-01-15"
 * toDateString("2026-01-15") // "2026-01-15"
 * toDateString(null) // null
 */
export function toDateString(date?: Date | string | null): string | null | undefined {
  if (!date) return null
  
  if (typeof date === 'string') {
    return date
  }
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  
  return null
}

/**
 * Get today's date as a string in PostgreSQL date format (YYYY-MM-DD)
 * @returns Today's date in YYYY-MM-DD format
 * 
 * @example
 * getToday() // "2026-01-15"
 */
export function getToday(): string {
  const result = toDateString(new Date())
  return result || ''
}

/**
 * Convert an object's date fields to PostgreSQL format
 * Useful when you have an object with multiple date fields
 * @param obj - Object with date fields
 * @param dateFields - Array of field names that are dates
 * @returns New object with date fields converted
 * 
 * @example
 * convertDateFields(
 *   { visitDate: new Date(), createdAt: new Date() },
 *   ['visitDate', 'createdAt']
 * )
 * // { visitDate: "2026-01-15", createdAt: "2026-01-15" }
 */
export function convertDateFields<T extends Record<string, any>>(
  obj: T,
  dateFields: Array<keyof T>,
): T {
  const result = { ...obj }
  
  for (const field of dateFields) {
    const value = result[field]
    if (value !== undefined && value !== null) {
      result[field] = toDateString(value) as any
    }
  }
  
  return result
}
