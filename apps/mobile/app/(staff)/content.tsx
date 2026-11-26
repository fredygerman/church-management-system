import { Text } from "react-native"
import { Card } from "../../components/ui"
import { api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

// Permission: manage:files (GET /api/files/user). Same documents list as the web Content page.
const loadDocuments = () => api.get<unknown>("/api/files/user").then(asRows)

export default function ContentScreen() {
  const { t } = useT()
  return (
    <StaffReadScreen area={t("mobile.staff.content.title")} emptyMessage={t("mobile.staff.content.empty")} isEmpty={(rows: StaffRow[]) => rows.length === 0} load={loadDocuments}>
      {(rows) => rows.map((row, index) => (
        <Card key={field(row, "id", String(index))}>
          <Text style={styles.heading}>{field(row, "title", t("mobile.staff.content.untitled"))}</Text>
          <Text style={styles.text}>{[field(row, "originalFileName"), row["visibleToMembers"] === true ? t("mobile.staff.content.visibleToMembers") : t("mobile.staff.content.staffOnly")].filter(Boolean).join(" · ")}</Text>
        </Card>
      ))}
    </StaffReadScreen>
  )
}
