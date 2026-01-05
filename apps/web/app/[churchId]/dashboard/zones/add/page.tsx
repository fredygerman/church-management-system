'use client'

import { useState } from 'react'
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

const zoneCreateSchema = z.object({
  name: z.string().min(2, 'Zone name must be at least 2 characters'),
  leader: z.string().optional(),
  description: z.string().optional(),
})

type ZoneCreateFormValues = z.infer<typeof zoneCreateSchema>

export default function ZoneAddPage() {
  const router = useRouter()
  const params = useParams()
  const churchId = params.churchId as string
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ZoneCreateFormValues>({
    resolver: zodResolver(zoneCreateSchema),
    defaultValues: {
      name: '',
      leader: '',
      description: '',
    },
  })

  async function onSubmit(data: ZoneCreateFormValues) {
    setIsSubmitting(true)
    try {
      // TODO: Implement createZone action with churchId
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
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/zones`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Zone</h1>
          <p className="text-gray-600">Add a new zone to your church</p>
        </div>
      </div>

      <div className="max-w-2xl">
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
                  name="leader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone Leader (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter zone leader name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the person who will lead this zone
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
      </div>
    </div>
  )
}
