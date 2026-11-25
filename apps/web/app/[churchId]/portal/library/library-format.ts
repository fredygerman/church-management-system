import type { LibraryDocument } from "@/actions/library"
import type { Translate } from "@church/config"

export function formatBytes(bytes: number, t: Translate): string {
  if (!Number.isFinite(bytes) || bytes < 0) return t("portal.library.unknownSize")
  if (bytes < 1024) return `${bytes} B`

  const units = ["KB", "MB", "GB", "TB"]
  let value = bytes
  let unitIndex = -1

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const format = (amount: number) => (amount >= 10 ? amount.toFixed(0) : amount.toFixed(1))
  let text = format(value)
  // Rounding can reach 1024 (for example 1023.9 KB); show it in the next unit instead.
  if (Number(text) >= 1024 && unitIndex < units.length - 1) {
    unitIndex += 1
    text = format(value / 1024)
  }

  return `${text} ${units[unitIndex]}`
}

export function formatFileType(document: LibraryDocument, t: Translate): string {
  const extension = document.original_file_name?.split(".").pop()
  if (extension && extension !== document.original_file_name) {
    return extension.toUpperCase()
  }

  return document.content_type?.split("/").pop()?.toUpperCase() || t("portal.library.fileFallback")
}
