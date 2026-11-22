import { Stack } from "expo-router"
import { SessionGate, SessionProvider } from "../lib/session"

export default function RootLayout() {
  return <SessionProvider><SessionGate /><Stack><Stack.Screen name="(auth)" options={{ headerShown: false }} /><Stack.Screen name="(member)" options={{ headerShown: false }} /><Stack.Screen name="(staff)" options={{ headerShown: false }} /></Stack></SessionProvider>
}
