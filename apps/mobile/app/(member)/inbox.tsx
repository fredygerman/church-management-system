import { useCallback, useEffect, useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, type Href } from "expo-router"
import { Card, Pill } from "../../components/ui"
import { colors, spacing, type } from "../../theme"
import { ApiError } from "../../lib/api"
import { useT } from "../../lib/locale"
import { notificationsApi, type NotificationItem } from "../../lib/library-api"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"
import { formatRelativeTime } from "../../components/events/format"
import { describeNotification } from "../../components/events/model"

// Per-recipient inbox. Opening an item with a target marks it read and opens the target; a failed mark keeps the item unread and reports it.
// Items without a route are read-only: no press, so they stay unread until "Mark all as read".

// Target types the API produces (events.service.ts, file-upload.service.ts). Any other type has no route yet.
function routeFor(target: NotificationItem["target"]): Href | null {
  if (!target) return null
  const param = (key: string) => {
    const value = target.params[key]
    return typeof value === "string" && value.length > 0 ? value : null
  }
  if (target.type === "event") {
    const eventId = param("eventId")
    return eventId ? `/(member)/events/${encodeURIComponent(eventId)}` : null
  }
  if (target.type === "library_resource") {
    const resourceId = param("resourceId")
    return resourceId ? { pathname: "/library-detail", params: { id: resourceId } } : null
  }
  return null
}

export default function InboxScreen() {
  const { t, locale } = useT()
  const router = useRouter()
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
    contentContainerStyle={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg }]}
    data={items}
    keyExtractor={(item) => item.id}
    ListEmptyComponent={<EmptyState message={t("wiring.inbox.empty")} />}
    ListHeaderComponent={<View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: !unreadOnly }} onPress={() => setUnreadOnly(false)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md }}>
          <Text style={{ ...type.supporting, color: !unreadOnly ? colors.brand : colors.muted, fontWeight: "600" }}>{t("wiring.inbox.all")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: unreadOnly }} onPress={() => setUnreadOnly(true)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md }}>
          <Text style={{ ...type.supporting, color: unreadOnly ? colors.brand : colors.muted, fontWeight: "600" }}>{t("wiring.inbox.unread")}</Text>
        </Pressable>
      </View>
      {unreadCount !== null ? <Pill label={t("wiring.inbox.unreadCount", { count: unreadCount })} /> : null}
      <Pressable accessibilityRole="button" onPress={() => void markAll()} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingHorizontal: spacing.sm }}>
        <Text style={{ ...type.supporting, color: colors.brand, fontWeight: "600" }}>{t("wiring.inbox.markAll")}</Text>
      </Pressable>
      {actionError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{actionError}</Text> : null}
    </View>}
    ListFooterComponent={cursor ? <Pressable accessibilityRole="button" onPress={() => void loadMore()} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}>
      <Text style={styles.heading}>{t("wiring.inbox.loadMore")}</Text>
    </Pressable> : undefined}
    renderItem={({ item }) => {
      const route = routeFor(item.target)
      return <NotificationRow item={item} onPress={route ? () => { void markRead(item); router.push(route) } : undefined} />
    }}
  />
}

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress?: () => void }) {
  const { t, locale } = useT()
  const unread = item.readAt == null
  const info = describeNotification(item.templateKey, item.templateData, locale, t("wiring.inbox.item"))
  const when = formatRelativeTime(item.createdAt, locale)
  return <Card onPress={onPress} style={{ marginBottom: spacing.sm, padding: spacing.md }}>
    <View accessibilityLabel={unread ? t("wiring.inbox.unreadLabel") : undefined} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: unread ? colors.brand : colors.tint }}>
        <Ionicons name={info.icon} size={20} color={unread ? colors.surface : colors.brand} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text numberOfLines={2} style={{ ...type.body, color: colors.ink, fontWeight: unread ? "700" : "500" }}>{info.title}</Text>
        {info.body ? <Text numberOfLines={2} style={{ ...type.supporting, color: unread ? colors.ink : colors.muted }}>{info.body}</Text> : null}
        {when ? <Text style={{ ...type.caption, color: colors.muted }}>{when}</Text> : null}
      </View>
      {unread ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand }} /> : null}
    </View>
  </Card>
}
