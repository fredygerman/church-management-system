import type { LibraryDocument } from "@/actions/library"

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size"
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

export function formatFileType(document: LibraryDocument): string {
  const extension = document.original_file_name?.split(".").pop()
  if (extension && extension !== document.original_file_name) {
    return extension.toUpperCase()
  }

  return document.content_type?.split("/").pop()?.toUpperCase() || "FILE"
}
