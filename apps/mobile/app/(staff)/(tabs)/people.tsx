import { useCallback, useState } from "react"
import { Text, View } from "react-native"
import { Button, Card, ListRow, TextField } from "../../../components/ui"
import { api } from "../../../lib/api"
import { fetchAllMembers } from "../../../lib/members-api"
import { useT } from "../../../lib/locale"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../../components/staff-read-screen"
import { styles } from "../../../components/screen-state"

type PeopleList = { rows: StaffRow[]; total: number; truncated: boolean }

// Permission: read:member (GET /members, GET /members/search?q=). Read-only directory search.
export default function PeopleScreen() {
  const { t } = useT()
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  // The unfiltered directory reads every page; search results are a single response.
  const load = useCallback(
    (): Promise<PeopleList> => query
      ? api.get<unknown>(`/members/search?q=${encodeURIComponent(query)}`).then((value) => {
        const rows = asRows(value)
        return { rows, total: rows.length, truncated: false }
      })
      : fetchAllMembers<StaffRow>(),
    [query],
  )
  const submit = () => setQuery(draft.trim())

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.content, { paddingBottom: 0 }]}>
        <TextField
          accessibilityLabel={t("staff.attendance.checkin.search")}
          label={t("staff.attendance.checkin.search")}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          returnKeyType="search"
          style={{ marginBottom: 0 }}
          value={draft}
        />
        <Button title={t("staff.attendance.checkin.search")} icon="search" onPress={submit} />
      </View>
      <StaffReadScreen area={t("mobile.staff.people.title")} emptyMessage={t("mobile.staff.people.empty")} isEmpty={(list: PeopleList) => list.rows.length === 0} load={load}>
        {(list) => (
          <>
            {list.truncated ? <Text style={styles.text}>{t("mobile.staff.people.truncated", { shown: list.rows.length, total: list.total })}</Text> : null}
            {list.rows.map((row, index) => {
              const name = `${field(row, "firstName")} ${field(row, "lastName")}`.trim() || t("mobile.staff.people.unnamed")
              return (
                <Card key={field(row, "id", String(index))}><ListRow icon="person-outline" title={name} /></Card>
              )
            })}
          </>
        )}
      </StaffReadScreen>
    </View>
  )
}
