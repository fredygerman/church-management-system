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
import * as z from 'zod'
import { createZone } from '@/actions/zone'

const zoneCreateSchema = z.object({
  name: z.string().min(2, 'Zone name must be at least 2 characters'),
  description: z.string().optional(),
  meetingDay: z.string().optional(),
})

type ZoneCreateFormValues = z.infer<typeof zoneCreateSchema>

interface ZoneCreateFormProps {
  churchId: string
}

export function ZoneCreateForm({ churchId }: ZoneCreateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ZoneCreateFormValues>({
    resolver: zodResolver(zoneCreateSchema as any),
    defaultValues: {
      name: '',
      description: '',
      meetingDay: '',
    },
  })

  async function onSubmit(data: ZoneCreateFormValues) {
    setIsSubmitting(true)
    try {
      await createZone({ churchId, ...data })
      toast.success('Zone created successfully!')
      router.push(`/${churchId}/dashboard/zones`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create zone'
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
          Enter the details for the new zone
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
                    <Input 
                      placeholder="e.g., Zone A, North Zone, Downtown Zone" 
                      {...field} 
                    />
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
                    Additional details about this zone (e.g., location, boundaries)
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
                    Creating...
                  </>
                ) : (
                  'Create Zone'
                )}
              </Button>
              <Link href={`/${churchId}/dashboard/zones`}>
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
