import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { ApiError } from "../../lib/api"
import { useT } from "../../lib/locale"
import { libraryApi, type LibraryResource } from "../../lib/library-api"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"
import { Button, Card, TextField } from "../../components/ui"
import { CategoryChip, LibraryMediaRow } from "../../components/library-media"
import { colors, spacing, type } from "../../theme"

// Minimal catalogue: server-side search and cursor pagination. Opening a row goes to library-detail.
// Category chips filter the pages already loaded; the server does not filter by category.
export default function LibraryCatalogScreen() {
  const { t } = useT()
  const router = useRouter()
  const [items, setItems] = useState<LibraryResource[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
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

  const categories = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.categories ?? []))).sort((a, b) => a.localeCompare(b)),
    [items],
  )
  const visibleItems = useMemo(
    () => (category ? items.filter((item) => item.categories?.includes(category)) : items),
    [category, items],
  )

  if (loading && items.length === 0) return <LoadingState />
  if (error && items.length === 0) return <ErrorState message={error} onRetry={() => void load(appliedQuery)} />

  return <FlatList
    contentContainerStyle={[styles.content, { padding: spacing.lg }]}
    data={visibleItems}
    keyExtractor={(item) => item.id}
    keyboardShouldPersistTaps="handled"
    ListEmptyComponent={<EmptyState message={appliedQuery || category ? t("wiring.library.noMatches") : t("wiring.library.empty")} />}
    ListHeaderComponent={<View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        label={t("wiring.library.search")}
        onChangeText={setSearch}
        onSubmitEditing={() => setAppliedQuery(search.trim())}
        placeholder={t("wiring.library.search")}
        returnKeyType="search"
        value={search}
      />
      <Button title={t("wiring.library.searchButton")} variant="secondary" icon="search-outline" onPress={() => setAppliedQuery(search.trim())} />
      {categories.length > 0 ? <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }} horizontal showsHorizontalScrollIndicator={false}>
        <CategoryChip label={t("mobile.member.library.all")} onPress={() => setCategory(null)} selected={category === null} />
        {categories.map((name) => <CategoryChip key={name} label={name} onPress={() => setCategory(name)} selected={category === name} />)}
      </ScrollView> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>}
    ListFooterComponent={<View>
      {moreError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{moreError}</Text> : null}
      {cursor ? <Pressable accessibilityRole="button" disabled={loadingMore} onPress={() => void loadMore()} style={{ minHeight: 44, marginVertical: spacing.md }}>
        <Card>
          {loadingMore ? <ActivityIndicator color={colors.brand} /> : <Text style={{ ...type.body, color: colors.brand, fontWeight: "600", textAlign: "center" }}>{t("wiring.library.loadMore")}</Text>}
        </Card>
      </Pressable> : null}
    </View>}
    renderItem={({ item }) => <LibraryMediaRow
      accessLabel={t("mobile.member.library.available")}
      coverLabel={t(`wiring.library.type.${item.resourceType}`)}
      kind={item.resourceType}
      onPress={() => router.push({ pathname: "/library-detail", params: { id: item.id } })}
      pillLabel={t(`wiring.library.type.${item.resourceType}`)}
      subtitle={item.authorSpeaker ?? item.description ?? undefined}
      title={item.title}
    />}
  />
}
