'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit2, Trash2, Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { getMemberById, deleteMember } from '@/actions/member'

interface Member {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  joinedDate: string
  phone?: string
  email?: string
  district?: string
  ward?: string
  street?: string
  zoneId?: string
  zoneName?: string
}

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const churchId = params.churchId as string
  const memberId = params.memberId as string

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    async function loadMember() {
      try {
        setLoading(true)
        setError(null)
        // TODO: Update getMemberById to work without churchId parameter
        const data = await getMemberById(memberId)
        setMember(data as Member)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load member'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (memberId) {
      loadMember()
    }
  }, [memberId])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMember(memberId)
      toast.success('Member deleted successfully')
      router.push(`/${churchId}/dashboard/members`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete member'
      toast.error(errorMessage)
      setShowDeleteDialog(false)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="text-lg text-gray-600">Loading member details...</div>
      </div>
    )
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
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
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
                <p className="text-sm font-medium text-gray-600">Joined Date</p>
                <p className="mt-1 text-lg font-semibold">
                  {new Date(member.joinedDate).toLocaleDateString()}
                </p>
              </div>
              {member.zoneName && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Zone</p>
                  <Link href={`/${churchId}/dashboard/zones/${member.zoneId}`}>
                    <p className="mt-1 text-lg font-semibold text-blue-600 hover:underline">
                      {member.zoneName}
                    </p>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">
                    {member.phone}
                  </a>
                </div>
              )}
              {member.street && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm">{member.street}</p>
                    {member.ward && <p className="text-sm">{member.ward}</p>}
                    {member.district && <p className="text-sm">{member.district}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                Send Message
              </Button>
              <Button className="w-full" variant="outline">
                View History
              </Button>
              <Button className="w-full" variant="outline">
                Add Note
              </Button>
            </CardContent>
          </Card>

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

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Member</CardTitle>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete {member.firstName} {member.lastName}?
                This action cannot be undone.
              </p>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
