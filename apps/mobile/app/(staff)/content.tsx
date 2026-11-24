import { Text, View } from "react-native"
import { api } from "../../lib/api"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

// Permission: manage:files (GET /api/files/user). Same documents list as the web Content page.
const loadDocuments = () => api.get<unknown>("/api/files/user").then(asRows)

export default function ContentScreen() {
  return (
    <StaffReadScreen area="Content" emptyMessage="No documents have been added yet." isEmpty={(rows: StaffRow[]) => rows.length === 0} load={loadDocuments}>
      {(rows) => rows.map((row, index) => (
        <View key={field(row, "id", String(index))} style={styles.card}>
          <Text style={styles.heading}>{field(row, "title", "Document")}</Text>
          <Text style={styles.text}>{[field(row, "originalFileName"), row["visibleToMembers"] === true ? "Visible to members" : "Staff only"].filter(Boolean).join(" · ")}</Text>
        </View>
      ))}
    </StaffReadScreen>
  )
}
