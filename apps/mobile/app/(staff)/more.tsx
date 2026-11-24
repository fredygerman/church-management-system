import { Button, ScrollView, Text } from "react-native"
import { SpacesSection } from "../../components/spaces-section"
import { styles } from "../../components/screen-state"
import { useSession } from "../../lib/session"

export default function MoreScreen() {
  const { user, signOut } = useSession()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.heading}>{typeof user?.name === "string" ? user.name : "Signed in"}</Text>
      {user?.activeRole ? <Text style={styles.text}>{user.activeRole}</Text> : null}
      <SpacesSection />
      <Button title="Sign out" onPress={() => void signOut()} />
    </ScrollView>
  )
}
