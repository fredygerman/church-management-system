import { getZones } from "@/actions/zone"

import { MemberForm } from "@/components/form/MemberForm"

export default async function NewMemberPage({
  params,
}: {
  params: { workspaceId: string }
}) {
  const { workspaceId } = params
  const zones = await getZones()

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        New Member Registration
      </h1>
      <MemberForm workspaceId={workspaceId} zones={zones} />
    </div>
  )
}
