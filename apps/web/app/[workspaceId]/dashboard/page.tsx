import { redirect } from "next/navigation"

export default async function DashboardPage({
  params,
}: {
  params: { workspaceId: string }
}) {
  const { workspaceId } = params
  redirect(`/${workspaceId}/dashboard`)
}
