import { redirect } from "next/navigation"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  const { churchId } = await params
  redirect(`/${churchId}/dashboard`)
}
