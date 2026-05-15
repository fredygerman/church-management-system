import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit2, Phone, MapPin } from 'lucide-react'
import { getMemberById, getMemberZones } from '@/actions/member'
import { getChurchById } from '@/actions/church'
import type { Member } from '@church/db'

interface MemberDetailPageProps {
  params: Promise<{
    churchId: string
    memberId: string
  }>
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { churchId, memberId } = await params
  let member: Member | null = null
  let church: any = null
  let zones: any[] = []
  let error: string | null = null

  try {
    member = await getMemberById(churchId, memberId)
    if (member) {
      church = await getChurchById(churchId)
      zones = await getMemberZones(churchId, memberId)
    }
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

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return '-'
    }
  }

  const capitalizeText = (text: string | null | undefined) => {
    if (!text) return '-'
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

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
                <p className="text-sm font-medium text-gray-600">First Name</p>
                <p className="mt-1 text-lg font-semibold">{member.firstName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Last Name</p>
                <p className="mt-1 text-lg font-semibold">{member.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Gender</p>
                <p className="mt-1 text-lg font-semibold capitalize">{capitalizeText(member.gender)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatDate(member.dateOfBirth)}
                </p>
                {age !== null && (
                  <p className="mt-1 text-sm text-gray-600">Age: {age} years</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Marital Status</p>
                <p className="mt-1 text-lg font-semibold capitalize">{capitalizeText(member.maritalStatus)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Occupation</p>
                <p className="mt-1 text-lg font-semibold">{member.occupation || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                {member.phone ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline font-semibold">
                      {member.phone}
                    </a>
                  </div>
                ) : (
                  <p className="mt-1 text-lg font-semibold">-</p>
                )}
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
                <p className="text-sm font-medium text-gray-600">Church</p>
                {church ? (
                  <div className="mt-1">
                    <p className="text-lg font-semibold">{church.name}</p>
                    <p className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {church.location}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-lg font-semibold">-</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date of Salvation</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatDate(member.dateOfSalvation)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Baptism Status</p>
                <p className="mt-1 text-lg font-semibold capitalize">
                  {member.baptismStatus ? capitalizeText(member.baptismStatus.replace(/_/g, ' ')) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatDate(member.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatDate(member.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Zones */}
          <Card>
            <CardHeader>
              <CardTitle>Zones</CardTitle>
            </CardHeader>
            <CardContent>
              {zones && zones.length > 0 ? (
                <div className="space-y-3">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-semibold">{zone.name}</p>
                        {zone.isLeader && (
                          <p className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 mt-1">
                            Zone Leader
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Not assigned to any zones</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {member.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
                  {member.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Quick Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs text-gray-600 break-all">{member.id}</p>
            </CardContent>
          </Card>

          {member.familyId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Family ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xs text-gray-600 break-all">{member.familyId}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {member.deletedAt ? (
                <p className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  Inactive
                </p>
              ) : (
                <p className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Active
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Age</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {age !== null ? `${age} years` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
