import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Phone, Mail, Calendar, Edit2 } from 'lucide-react'
import { getVisitorById } from '@/actions/visitor'
import { checkPermission } from '@/lib/permissions-server'
import type { Visitor } from '@church/db'

interface VisitorDetailPageProps {
  params: Promise<{
    churchId: string
    visitorId: string
  }>
}

export default async function VisitorDetailPage({ params }: VisitorDetailPageProps) {
  const { churchId, visitorId } = await params
  let visitor: Visitor | null = null
  let error: string | null = null
  let canEdit = false

  try {
    visitor = await getVisitorById(churchId, visitorId)
    canEdit = await checkPermission('update:visitor')
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load visitor'
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/visitors`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Visitors
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/visitors`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Visitors
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-700">Visitor not found</p>
        </div>
      </div>
    )
  }

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

  const capitalizeText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/visitors`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {visitor.firstName} {visitor.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">Visitor Details</p>
          </div>
        </div>
        
        {canEdit && (
          <Link href={`/${churchId}/dashboard/visitors/${visitorId}/edit`}>
            <Button>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Visitor
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {visitor.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">{visitor.phone}</p>
                  </div>
                </div>
              )}
              {visitor.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{visitor.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Visit Date</p>
                  <p className="text-sm">{formatDate(visitor.visitDate)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">How They Found Us</p>
                <p className="text-sm capitalize mt-1">
                  {visitor.visitorSource?.replace('_', ' ') || '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Conversion Status
                  </p>
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                    {visitor.convertedToMemberId ? 'Converted' : 'Pending'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(visitor.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Updated</p>
                <p className="text-sm">{formatDate(visitor.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
