import { Text, View } from "react-native"
import { api } from "../../lib/api"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

// Permission: view:attendance (GET /attendance/service-types, GET /attendance/sessions)
const loadServices = async () => {
  const [types, sessions] = await Promise.all([api.get<unknown>("/attendance/service-types"), api.get<unknown>("/attendance/sessions")])
  return { types: asRows(types), sessions: asRows(sessions) }
}

export default function ServicesScreen() {
  return (
    <StaffReadScreen
      area="Services"
      emptyMessage="There are no service types or sessions yet."
      isEmpty={(data: { types: StaffRow[]; sessions: StaffRow[] }) => data.types.length === 0 && data.sessions.length === 0}
      load={loadServices}
    >
      {({ types, sessions }) => (
        <>
          <Text style={styles.heading}>Service types</Text>
          {types.length ? types.map((row, index) => (
            <View key={field(row, "id", `type-${index}`)} style={styles.card}>
              <Text style={styles.heading}>{field(row, "name", "Service type")}</Text>
              <Text style={styles.text}>{row["isActive"] === false ? "Inactive" : "Active"}</Text>
            </View>
          )) : <Text style={styles.text}>No service types yet.</Text>}
          <Text style={styles.heading}>Sessions</Text>
          {sessions.length ? sessions.map((row, index) => (
            <View key={field(row, "id", `session-${index}`)} style={styles.card}>
              <Text style={styles.heading}>{field(row, "title") || field(row, "sessionDate", "Session")}</Text>
              <Text style={styles.text}>{[field(row, "sessionDate"), field(row, "status")].filter(Boolean).join(" · ")}</Text>
            </View>
          )) : <Text style={styles.text}>No sessions yet.</Text>}
        </>
      )}
    </StaffReadScreen>
  )
}
