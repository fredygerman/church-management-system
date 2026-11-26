import { Text, View } from "react-native"
import { Button, Card, ListRow, Pill, SectionHeader } from "../../../components/ui"
import { router } from "expo-router"
import { api } from "../../../lib/api"
import { roleHasTabPermission } from "../../../lib/claims"
import { useT } from "../../../lib/locale"
import { useSession } from "../../../lib/session"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../../components/staff-read-screen"
import { styles } from "../../../components/screen-state"

// Permission: view:attendance (GET /attendance/service-types, GET /attendance/sessions)
const loadServices = async () => {
  const [types, sessions] = await Promise.all([api.get<unknown>("/attendance/service-types"), api.get<unknown>("/attendance/sessions")])
  return { types: asRows(types), sessions: asRows(sessions) }
}

export default function ServicesScreen() {
  const { t } = useT()
  const { user } = useSession()
  const canCheckIn = roleHasTabPermission(user?.activeRole ?? undefined, "manage:attendance")
  return (
    <StaffReadScreen
      area={t("mobile.staff.services.title")}
      emptyMessage={t("mobile.staff.services.empty")}
      isEmpty={(data: { types: StaffRow[]; sessions: StaffRow[] }) => data.types.length === 0 && data.sessions.length === 0}
      load={loadServices}
    >
      {({ types, sessions }) => (
        <>
          {canCheckIn ? <Button title={t("wiring.checkin.open")} icon="checkmark-circle-outline" onPress={() => router.push("/attendance")} /> : null}
          <SectionHeader title={t("mobile.staff.services.typesHeading")} />
          {types.length ? types.map((row, index) => (
            <Card key={field(row, "id", `type-${index}`)}><ListRow icon="briefcase-outline" title={field(row, "name", t("mobile.staff.services.typeFallback"))} trailing={<Pill label={row["isActive"] === false ? t("mobile.staff.services.inactive") : t("mobile.staff.services.active")} tone={row["isActive"] === false ? "default" : "success"} />} /></Card>
          )) : <Text style={styles.text}>{t("mobile.staff.services.noTypes")}</Text>}
          <SectionHeader title={t("mobile.staff.services.sessionsHeading")} />
          {sessions.length ? sessions.map((row, index) => (
            <Card key={field(row, "id", `session-${index}`)}><ListRow icon="calendar-outline" title={field(row, "title") || field(row, "sessionDate", t("mobile.staff.services.sessionFallback"))} subtitle={[field(row, "sessionDate"), field(row, "status")].filter(Boolean).join(" · ")} /></Card>
          )) : <Text style={styles.text}>{t("mobile.staff.services.noSessions")}</Text>}
        </>
      )}
    </StaffReadScreen>
  )
}
