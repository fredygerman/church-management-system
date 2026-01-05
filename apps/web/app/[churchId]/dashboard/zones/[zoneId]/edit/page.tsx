'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader } from 'lucide-react'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const zoneEditSchema = z.object({
  name: z.string().min(2, 'Zone name must be at least 2 characters'),
  leader: z.string().optional(),
  description: z.string().optional(),
})

type ZoneEditFormValues = z.infer<typeof zoneEditSchema>

interface Zone {
  id: string
  name: string
  leader?: string
  description?: string
}

export default function ZoneEditPage() {
  const router = useRouter()
  const params = useParams()
  const churchId = params.churchId as string
  const zoneId = params.zoneId as string

  const [zone, setZone] = useState<Zone | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ZoneEditFormValues>({
    resolver: zodResolver(zoneEditSchema),
    defaultValues: {
      name: '',
      leader: '',
      description: '',
    },
  })

  useEffect(() => {
    async function loadZone() {
      try {
        setLoading(true)
        setError(null)
        // TODO: Implement getZoneById action
        const mockZone: Zone = {
          id: zoneId,
          name: 'Zone 1',
          leader: 'John Doe',
          description: 'This is a sample zone',
        }
        setZone(mockZone)
        form.reset({
          name: mockZone.name,
          leader: mockZone.leader,
          description: mockZone.description,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load zone'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (zoneId) {
      loadZone()
    }
  }, [zoneId, form])

  async function onSubmit(data: ZoneEditFormValues) {
    setIsSubmitting(true)
    try {
      // TODO: Implement updateZone action
      toast.success('Zone updated successfully!')
      router.push(`/${churchId}/dashboard/zones/${zoneId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update zone'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">Loading zone details...</p>
      </div>
    )
  }

  if (error || !zone) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/zones/${zoneId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error || 'Zone not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/zones/${zoneId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Zone</h1>
          <p className="text-gray-600">{zone.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Zone Information</CardTitle>
            <CardDescription>
              Update the zone's basic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter zone name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="leader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone Leader (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter zone leader name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the person leading this zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter zone description..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional details about this zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Link href={`/${churchId}/dashboard/zones/${zoneId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
