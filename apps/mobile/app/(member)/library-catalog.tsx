import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { ApiError } from "../../lib/api"
import { useT } from "../../lib/locale"
import { libraryApi, type LibraryResource } from "../../lib/library-api"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

// Minimal catalogue: server-side search and cursor pagination. Opening a row goes to library-detail.
export default function LibraryCatalogScreen() {
  const { t } = useT()
  const router = useRouter()
  const [items, setItems] = useState<LibraryResource[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [moreError, setMoreError] = useState("")

  const load = useCallback(async (query: string) => {
    setLoading(true)
    setError("")
    try {
      const page = await libraryApi.list({ query: query || undefined })
      setItems(page.items)
      setCursor(page.nextCursor)
    } catch (caught) {
      // A failed request is an error state, never an empty catalogue.
      setItems([])
      setCursor(null)
      setError(caught instanceof ApiError ? caught.message : t("wiring.library.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { void load(appliedQuery) }, [load, appliedQuery])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    setMoreError("")
    try {
      const page = await libraryApi.list({ cursor, query: appliedQuery || undefined })
      setItems((current) => [...current, ...page.items])
      setCursor(page.nextCursor)
    } catch (caught) {
      setMoreError(caught instanceof ApiError ? caught.message : t("wiring.library.loadError"))
    } finally {
      setLoadingMore(false)
    }
  }, [appliedQuery, cursor, loadingMore, t])

  if (loading && items.length === 0) return <LoadingState />
  if (error && items.length === 0) return <ErrorState message={error} onRetry={() => void load(appliedQuery)} />

  return <FlatList
    contentContainerStyle={styles.content}
    data={items}
    keyExtractor={(item) => item.id}
    keyboardShouldPersistTaps="handled"
    ListEmptyComponent={<EmptyState message={appliedQuery ? t("wiring.library.noMatches") : t("wiring.library.empty")} />}
    ListHeaderComponent={<View>
      <Text style={styles.formLabel}>{t("wiring.library.search")}</Text>
      <TextInput
        accessibilityLabel={t("wiring.library.search")}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setSearch}
        onSubmitEditing={() => setAppliedQuery(search.trim())}
        returnKeyType="search"
        style={styles.input}
        value={search}
      />
      <Pressable accessibilityRole="button" onPress={() => setAppliedQuery(search.trim())} style={styles.card}>
        <Text style={styles.heading}>{t("wiring.library.searchButton")}</Text>
      </Pressable>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>}
    ListFooterComponent={<View>
      {moreError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{moreError}</Text> : null}
      {cursor ? <Pressable accessibilityRole="button" disabled={loadingMore} onPress={() => void loadMore()} style={styles.card}>
        {loadingMore ? <ActivityIndicator /> : <Text style={styles.heading}>{t("wiring.library.loadMore")}</Text>}
      </Pressable> : null}
    </View>}
    renderItem={({ item }) => <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/library-detail", params: { id: item.id } })}
      style={styles.card}
    >
      <Text style={styles.heading}>{item.title}</Text>
      {item.description ? <Text style={styles.text}>{item.description}</Text> : null}
      <Text style={styles.text}>{t(`wiring.library.type.${item.resourceType}`)}</Text>
    </Pressable>}
  />
}
