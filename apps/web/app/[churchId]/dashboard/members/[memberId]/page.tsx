import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit2, Phone } from 'lucide-react'
import { getMemberById } from '@/actions/member'
import type { Member } from '@church/db'

interface MemberDetailPageProps {
  params: {
    churchId: string
    memberId: string
  }
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { churchId, memberId } = params
  let member: Member | null = null
  let error: string | null = null

  try {
    member = await getMemberById(memberId)
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load member'
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/members`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Members
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/members`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Members
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-700">Member not found</p>
        </div>
      </div>
    )
  }

  const age = member.dateOfBirth
    ? new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()
    : null

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/members`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {member.firstName} {member.lastName}
            </h1>
            <p className="text-gray-600">Member Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${churchId}/dashboard/members/${memberId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Gender</p>
                <p className="mt-1 text-lg font-semibold">{member.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                <p className="mt-1 text-lg font-semibold">
                  {new Date(member.dateOfBirth).toLocaleDateString()}
                </p>
                {age !== null && (
                  <p className="mt-1 text-sm text-gray-600">Age: {age} years</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Marital Status</p>
                <p className="mt-1 text-lg font-semibold">{member.maritalStatus}</p>
              </div>
            </CardContent>
          </Card>

          {/* Church Information */}
          <Card>
            <CardHeader>
              <CardTitle>Church Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupation</p>
                <p className="mt-1 text-lg font-semibold">{member.occupation || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">
                    {member.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs text-gray-600 break-all">{member.id}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
