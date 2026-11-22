import { Tabs } from "expo-router"

export default function MemberLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="church" options={{ title: "Church" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="events/[id]" options={{ href: null, title: "Event" }} />
      <Tabs.Screen name="prayer" options={{ href: null, title: "Prayer" }} />
    </Tabs>
  )
}
