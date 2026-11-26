/**
 * Mask a phone number for logs: keeps the country prefix and the last three digits.
 * "+255712345678" -> "+255***678". Short or empty input is fully masked.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '***';

  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length <= 7) return '***';

  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}
