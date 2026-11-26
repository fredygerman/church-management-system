import { useCallback, useState } from "react"
import { Button, Text, TextInput, View } from "react-native"
import { api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

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
        <TextInput
          accessibilityLabel={t("staff.attendance.checkin.search")}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          returnKeyType="search"
          style={styles.input}
          value={draft}
        />
        <Button title={t("staff.attendance.checkin.search")} onPress={submit} />
      </View>
      <StaffReadScreen area={t("mobile.staff.people.title")} emptyMessage={t("mobile.staff.people.empty")} isEmpty={(rows: StaffRow[]) => rows.length === 0} load={load}>
        {(rows) => rows.map((row, index) => {
          const name = `${field(row, "firstName")} ${field(row, "lastName")}`.trim() || t("mobile.staff.people.unnamed")
          return (
            <View key={field(row, "id", String(index))} style={styles.card}>
              <Text style={styles.heading}>{name}</Text>
            </View>
          )
        })}
      </StaffReadScreen>
    </View>
  )
}
