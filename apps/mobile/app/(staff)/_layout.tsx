import { Tabs } from "expo-router"
import { AiHeaderButton } from "../../components/ai/ai-header-button"

export default function StaffLayout() {
  return (
    <Tabs screenOptions={{ headerRight: () => <AiHeaderButton /> }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="people" options={{ title: "People" }} />
      <Tabs.Screen name="services" options={{ title: "Services" }} />
      <Tabs.Screen name="content" options={{ title: "Content" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  )
}
