import { Text, View } from "react-native"
import { api } from "../../lib/api"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

// Permission: read:member (GET /members)
const loadMembers = () => api.get<unknown>("/members").then(asRows)

export default function PeopleScreen() {
  return (
    <StaffReadScreen area="People" emptyMessage="There are no members yet." isEmpty={(rows: StaffRow[]) => rows.length === 0} load={loadMembers}>
      {(rows) => rows.map((row, index) => {
        const name = `${field(row, "firstName")} ${field(row, "lastName")}`.trim() || "Member"
        return (
          <View key={field(row, "id", String(index))} style={styles.card}>
            <Text style={styles.heading}>{name}</Text>
          </View>
        )
      })}
    </StaffReadScreen>
  )
}
