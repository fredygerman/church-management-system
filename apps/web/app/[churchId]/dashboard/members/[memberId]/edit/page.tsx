import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getMemberById } from '@/actions/member'
import { MemberEditForm } from '@/components/member/member-edit-form'
import { ensurePermission } from '@/lib/permissions-server'

interface MemberEditPageProps {
  params: {
    churchId: string
    memberId: string
  }
}

export default async function MemberEditPage({ params }: MemberEditPageProps) {
  await ensurePermission('update:member')
  const { churchId, memberId } = params

  let member = null
  let error = null

  try {
    member = await getMemberById(churchId, memberId)
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load member'
  }

  if (error || !member) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/members/${memberId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error || 'Member not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/members/${memberId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Member</h1>
          <p className="text-gray-600">
            {member.firstName} {member.lastName}
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <MemberEditForm member={member} churchId={churchId} />
      </div>
    </div>
  )
}
