import { Button, Text, View } from "react-native"
import { router } from "expo-router"
import { api } from "../../lib/api"
import { roleHasTabPermission } from "../../lib/claims"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"
import { StaffReadScreen, asRows, field, type StaffRow } from "../../components/staff-read-screen"
import { styles } from "../../components/screen-state"

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
          {canCheckIn ? <Button title={t("wiring.checkin.open")} onPress={() => router.push("/attendance")} /> : null}
          <Text style={styles.heading}>{t("mobile.staff.services.typesHeading")}</Text>
          {types.length ? types.map((row, index) => (
            <View key={field(row, "id", `type-${index}`)} style={styles.card}>
              <Text style={styles.heading}>{field(row, "name", t("mobile.staff.services.typeFallback"))}</Text>
              <Text style={styles.text}>{row["isActive"] === false ? t("mobile.staff.services.inactive") : t("mobile.staff.services.active")}</Text>
            </View>
          )) : <Text style={styles.text}>{t("mobile.staff.services.noTypes")}</Text>}
          <Text style={styles.heading}>{t("mobile.staff.services.sessionsHeading")}</Text>
          {sessions.length ? sessions.map((row, index) => (
            <View key={field(row, "id", `session-${index}`)} style={styles.card}>
              <Text style={styles.heading}>{field(row, "title") || field(row, "sessionDate", t("mobile.staff.services.sessionFallback"))}</Text>
              <Text style={styles.text}>{[field(row, "sessionDate"), field(row, "status")].filter(Boolean).join(" · ")}</Text>
            </View>
          )) : <Text style={styles.text}>{t("mobile.staff.services.noSessions")}</Text>}
        </>
      )}
    </StaffReadScreen>
  )
}
