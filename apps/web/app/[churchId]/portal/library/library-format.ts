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

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

export function formatFileType(document: LibraryDocument, t: Translate): string {
  const extension = document.original_file_name?.split(".").pop()
  if (extension && extension !== document.original_file_name) {
    return extension.toUpperCase()
  }

  return document.content_type?.split("/").pop()?.toUpperCase() || t("portal.library.fileFallback")
}
