import { Button, ScrollView, Text } from "react-native"
import { SpacesSection } from "../../components/spaces-section"
import { styles } from "../../components/screen-state"
import { useSession } from "../../lib/session"

// Role values are stored as enum keys (zone_leader); show them as words.
function roleLabel(role: string) {
  const words = role.replace(/_/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export default function MoreScreen() {
  const { user, signOut } = useSession()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.heading}>{typeof user?.name === "string" ? user.name : "Signed in"}</Text>
      {user?.activeRole ? <Text style={styles.text}>{roleLabel(user.activeRole)}</Text> : null}
      <SpacesSection />
      <Button title="Sign out" onPress={() => void signOut()} />
    </ScrollView>
  )
}
