import { Text, View } from "react-native"
import { api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

// Permission: read:member (GET /members)
const loadMembers = () => api.get<unknown>("/members").then(asRows)

export default function PeopleScreen() {
  const { t } = useT()
  return (
    <StaffReadScreen area={t("mobile.staff.people.title")} emptyMessage={t("mobile.staff.people.empty")} isEmpty={(rows: StaffRow[]) => rows.length === 0} load={loadMembers}>
      {(rows) => rows.map((row, index) => {
        const name = `${field(row, "firstName")} ${field(row, "lastName")}`.trim() || t("mobile.staff.people.unnamed")
        return (
          <View key={field(row, "id", String(index))} style={styles.card}>
            <Text style={styles.heading}>{name}</Text>
          </View>
        )
      })}
    </StaffReadScreen>
  )
}
