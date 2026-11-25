import { Tabs } from "expo-router"
import { AiHeaderButton } from "../../components/ai/ai-header-button"
import { roleHasTabPermission, type StaffTabPermission } from "../../lib/claims"
import { useSession } from "../../lib/session"

export default function StaffLayout() {
  const { user } = useSession()
  // Hidden tabs (href null) stay reachable by URL; the API still rejects calls the role lacks.
  const tabHref = (permission: StaffTabPermission) =>
    roleHasTabPermission(user?.activeRole ?? undefined, permission) ? undefined : null

  return (
    <Tabs screenOptions={{ headerRight: () => <AiHeaderButton /> }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard", href: tabHref("read:member") }} />
      <Tabs.Screen name="people" options={{ title: "People", href: tabHref("read:member") }} />
      <Tabs.Screen name="services" options={{ title: "Services", href: tabHref("view:attendance") }} />
      <Tabs.Screen name="content" options={{ title: "Content", href: tabHref("manage:files") }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  )
}
