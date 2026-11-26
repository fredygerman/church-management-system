import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native"
import { ApiError } from "../../lib/api"
import { useT } from "../../lib/locale"
import { formatLocaleDate } from "@church/config/i18n"
import { notificationsApi, type NotificationItem } from "../../lib/library-api"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

// Per-recipient inbox. Opening an item marks it read; a failed mark keeps the item unread and reports it.
// Targets are not followed yet (the typed target descriptor needs its own route resolver).
export default function InboxScreen() {
  const { t, locale } = useT()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")

  const load = useCallback(async (unread: boolean) => {
    setLoading(true)
    setError("")
    try {
      const page = await notificationsApi.list({ unread })
      setItems(page.items)
      setCursor(page.nextCursor)
      setUnreadCount(page.unreadCount)
    } catch (caught) {
      setItems([])
      setCursor(null)
      setUnreadCount(null)
      setError(caught instanceof ApiError ? caught.message : t("wiring.inbox.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { void load(unreadOnly) }, [load, unreadOnly])

  const loadMore = useCallback(async () => {
    if (!cursor) return
    try {
      const page = await notificationsApi.list({ cursor, unread: unreadOnly })
      setItems((current) => [...current, ...page.items])
      setCursor(page.nextCursor)
    } catch {
      setActionError(t("wiring.inbox.loadError"))
    }
  }, [cursor, t, unreadOnly])

  const markRead = useCallback(async (item: NotificationItem) => {
    if (item.readAt) return
    setActionError("")
    try {
      const updated = await notificationsApi.markRead(item.id)
      setItems((current) => current.map((row) => (row.id === item.id ? updated : row)))
      setUnreadCount((count) => (count === null ? null : Math.max(0, count - 1)))
    } catch {
      setActionError(t("wiring.inbox.markError"))
    }
  }, [t])

  const markAll = useCallback(async () => {
    setActionError("")
    try {
      await notificationsApi.markAllRead()
      await load(unreadOnly)
    } catch {
      setActionError(t("wiring.inbox.markError"))
    }
  }, [load, t, unreadOnly])

  if (loading && items.length === 0) return <LoadingState />
  if (error && items.length === 0) return <ErrorState message={error} onRetry={() => void load(unreadOnly)} />

  return <FlatList
    contentContainerStyle={styles.content}
    data={items}
    keyExtractor={(item) => item.id}
    ListEmptyComponent={<EmptyState message={t("wiring.inbox.empty")} />}
    ListHeaderComponent={<View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: !unreadOnly }} onPress={() => setUnreadOnly(false)} style={styles.card}>
          <Text style={styles.heading}>{t("wiring.inbox.all")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: unreadOnly }} onPress={() => setUnreadOnly(true)} style={styles.card}>
          <Text style={styles.heading}>{t("wiring.inbox.unread")}</Text>
        </Pressable>
      </View>
      {unreadCount !== null ? <Text style={styles.text}>{t("wiring.inbox.unreadCount", { count: unreadCount })}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => void markAll()} style={styles.card}>
        <Text style={styles.heading}>{t("wiring.inbox.markAll")}</Text>
      </Pressable>
      {actionError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{actionError}</Text> : null}
    </View>}
    ListFooterComponent={cursor ? <Pressable accessibilityRole="button" onPress={() => void loadMore()} style={styles.card}>
      <Text style={styles.heading}>{t("wiring.inbox.loadMore")}</Text>
    </Pressable> : undefined}
    renderItem={({ item }) => {
      const unread = item.readAt == null
      return <Pressable
        accessibilityHint={unread ? t("wiring.inbox.unreadLabel") : undefined}
        accessibilityRole="button"
        onPress={() => void markRead(item)}
        style={styles.card}
      >
        <Text style={styles.heading}>{unread ? `● ${t("wiring.inbox.item")}` : t("wiring.inbox.item")}</Text>
        <Text style={styles.text}>{formatLocaleDate(item.createdAt, locale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>
      </Pressable>
    }}
  />
}
