import { redirect } from "next/navigation"

export default async function PortalPage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  const { churchId } = await params
  redirect(`/${churchId}/portal/profile`)
}
