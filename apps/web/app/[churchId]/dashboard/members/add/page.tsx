import { getZones } from "@/actions/zone"
import { ensurePermission } from "@/lib/permissions-server"

import { MemberForm } from "@/components/form/MemberForm"

export default async function NewMemberPage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  await ensurePermission('create:member')
  const { churchId } = await params
  const zones = await getZones(churchId)

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        New Member Registration
      </h1>
      <MemberForm churchId={churchId} zones={zones} />
    </div>
  )
}
