import { redirect } from "next/navigation"

export default async function DashboardPage({
  params,
}: {
  params: { churchId: string }
}) {
  const { churchId } = params
  redirect(`/${churchId}/dashboard`)
}
