'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from 'lucide-react'
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
import { z } from 'zod'
import { updateZone } from '@/actions/zone'
import type { Zone } from '@church/db'

const zoneEditSchema = z.object({
  name: z.string().min(2, 'Zone name must be at least 2 characters'),
  description: z.string().optional(),
  meetingDay: z.string().optional(),
})

type ZoneEditFormValues = z.infer<typeof zoneEditSchema>

interface ZoneEditFormProps {
  zone: Zone
  churchId: string
}

export function ZoneEditForm({ zone, churchId }: ZoneEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ZoneEditFormValues>({
    resolver: zodResolver(zoneEditSchema as any),
    defaultValues: {
      name: zone.name,
      description: zone.description || '',
      meetingDay: zone.meetingDay || '',
    },
  })

  async function onSubmit(data: ZoneEditFormValues) {
    setIsSubmitting(true)
    try {
      await updateZone(zone.id, data)
      toast.success('Zone updated successfully!')
      router.push(`/${churchId}/dashboard/zones/${zone.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update zone'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
              name="meetingDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Day (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monday, Wednesday" {...field} />
                  </FormControl>
                  <FormDescription>
                    The day this zone meets
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
              <Link href={`/${churchId}/dashboard/zones/${zone.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
