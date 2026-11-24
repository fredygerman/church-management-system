import { Text, View } from "react-native"
import { api } from "../../lib/api"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

// Permission: view:communications (GET /communications/campaigns)
const loadCampaigns = () => api.get<unknown>("/communications/campaigns").then(asRows)

export default function ContentScreen() {
  return (
    <StaffReadScreen area="Content" emptyMessage="There are no campaigns yet." isEmpty={(rows: StaffRow[]) => rows.length === 0} load={loadCampaigns}>
      {(rows) => rows.map((row, index) => (
        <View key={field(row, "id", String(index))} style={styles.card}>
          <Text style={styles.heading}>{field(row, "name", "Campaign")}</Text>
          <Text style={styles.text}>{[field(row, "channel").toUpperCase(), field(row, "status")].filter(Boolean).join(" · ")}</Text>
        </View>
      ))}
    </StaffReadScreen>
  )
}
