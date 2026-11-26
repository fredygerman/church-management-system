import { useCallback, useState } from "react"
import { Text, View } from "react-native"
import { Button, Card, ListRow, TextField } from "../../../components/ui"
import { api } from "../../../lib/api"
import { useT } from "../../../lib/locale"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../../components/staff-read-screen"
import { styles } from "../../../components/screen-state"

// Permission: read:member (GET /members, GET /members/search?q=). Read-only directory search.
export default function PeopleScreen() {
  const { t } = useT()
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  const load = useCallback(
    () => (query ? api.get<unknown>(`/members/search?q=${encodeURIComponent(query)}`) : api.get<unknown>("/members")).then(asRows),
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
      <StaffReadScreen area={t("mobile.staff.people.title")} emptyMessage={t("mobile.staff.people.empty")} isEmpty={(rows: StaffRow[]) => rows.length === 0} load={load}>
        {(rows) => rows.map((row, index) => {
          const name = `${field(row, "firstName")} ${field(row, "lastName")}`.trim() || t("mobile.staff.people.unnamed")
          return (
            <Card key={field(row, "id", String(index))}><ListRow icon="person-outline" title={name} /></Card>
          )
        })}
      </StaffReadScreen>
    </View>
  )
}
