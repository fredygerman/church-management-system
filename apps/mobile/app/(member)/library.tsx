import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

type LibraryDocument = {
  id: string
  title: string
  description: string | null
  original_file_name: string
  content_type: string
  size_bytes: number
  created_at: string
}

type LibraryResponse = LibraryDocument[] | { documents?: LibraryDocument[] }

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function fileType(document: LibraryDocument) {
  const contentType = document.content_type.split("/")[1]?.toUpperCase()
  if (contentType) return contentType
  const extension = document.original_file_name.split(".").pop()?.toUpperCase()
  return extension || "FILE"
}

export default function LibraryScreen() {
  const { user } = useSession()
  const churchId = typeof user?.churchId === "string" ? user.churchId : null
  const [documents, setDocuments] = useState<LibraryDocument[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!churchId) {
      setError("Your account does not include a church.")
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await api.get<LibraryResponse>(`/files/library?churchId=${encodeURIComponent(churchId)}`)
      const nextDocuments = Array.isArray(data) ? data : data.documents
      setDocuments(Array.isArray(nextDocuments) ? nextDocuments : [])
      setError("")
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load shared documents.")
    } finally {
      setLoading(false)
    }
  }, [churchId])

  useEffect(() => { void load() }, [load])

  const openDocument = useCallback(async (document: LibraryDocument) => {
    if (!churchId || downloadingId) return
    setDownloadingId(document.id)
    setRowErrors((current) => ({ ...current, [document.id]: "" }))
    try {
      const result = await api.get<{ url: string }>(`/files/library/${encodeURIComponent(document.id)}/download-url?churchId=${encodeURIComponent(churchId)}`)
      await Linking.openURL(result.url)
    } catch (caught) {
      const message = caught instanceof ApiError && caught.status === 404
        ? "This document is no longer available."
        : "Unable to open this document. Please try again."
      setRowErrors((current) => ({ ...current, [document.id]: message }))
    } finally {
      setDownloadingId(null)
    }
  }, [churchId, downloadingId])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!documents.length) return <EmptyState message="No shared documents have been published yet." />

  return <FlatList
    contentContainerStyle={styles.content}
    data={documents}
    keyExtractor={(document) => document.id}
    renderItem={({ item }) => {
      const busy = downloadingId === item.id
      const rowError = rowErrors[item.id]
      return <Pressable
        accessibilityLabel={item.title}
        accessibilityRole="button"
        accessibilityState={{ busy }}
        disabled={Boolean(downloadingId)}
        onPress={() => void openDocument(item)}
        style={styles.card}
      >
        <View style={libraryStyles.rowHeader}>
          <Text style={styles.heading}>{item.title}</Text>
          {busy ? <ActivityIndicator accessibilityLabel="Opening document" /> : null}
        </View>
        {item.description ? <Text style={styles.text}>{item.description}</Text> : null}
        <Text style={libraryStyles.metadata}>{fileType(item)} · {formatFileSize(item.size_bytes)}</Text>
        {rowError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{rowError}</Text> : null}
      </Pressable>
    }}
  />
}

const libraryStyles = StyleSheet.create({
  metadata: { color: "#4b5563", fontSize: 14 },
  rowHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
})

// TODO: Have fluent reviewers provide Swahili copy before localization.
