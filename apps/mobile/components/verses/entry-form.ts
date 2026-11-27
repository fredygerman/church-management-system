import type { VerseEntryInput } from "./verse-api"

export type EntryFormValues = { reference: string; textEn: string; textSw: string }

/** Reference and English text are required; the form cannot be saved until both have content. */
export function canSaveEntry(values: EntryFormValues): boolean {
  return values.reference.trim().length > 0 && values.textEn.trim().length > 0
}

/**
 * Builds the request body. On create an empty Swahili text is left out.
 * On update it is sent as null, which clears a previously saved Swahili text.
 */
export function toEntryInput(values: EntryFormValues, mode: "create" | "update"): VerseEntryInput {
  const textSw = values.textSw.trim()
  const input: VerseEntryInput = { reference: values.reference.trim(), textEn: values.textEn.trim() }
  if (textSw) input.textSw = textSw
  else if (mode === "update") input.textSw = null
  return input
}
