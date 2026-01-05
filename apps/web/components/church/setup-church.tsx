'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { setupChurch } from '@/actions/church'

const churchFormSchema = z.object({
  name: z.string().min(2, 'Church name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  leadPastorName: z.string().min(2, 'Pastor name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
}) as any

type ChurchFormValues = z.infer<typeof churchFormSchema>

interface SetupChurchProps {
  onSuccess?: (churchId: string) => void
}

export function SetupChurch({ onSuccess }: SetupChurchProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(churchFormSchema) as any,
    defaultValues: {
      name: '',
      location: '',
      leadPastorName: '',
      phone: '',
      email: '',
      description: '',
    },
  })


  async function onSubmit(data: ChurchFormValues) {
    setIsLoading(true)
    setError(null)
    try {
      const result = await setupChurch({
        name: data.name,
        location: data.location,
        leadPastorName: data.leadPastorName,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
      })

      // After successful setup, redirect to the church dashboard
      toast.success('Church setup completed! Redirecting to dashboard...')
      
      if (onSuccess) {
        onSuccess(result.church.id)
      }
      
      // Use setTimeout to ensure user sees the success message
      setTimeout(() => {
        router.push(`/${result.church.id}/dashboard`)
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup church'
      console.error('Church setup error:', error)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-lg bg-blue-100 p-3">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl">Setup Your Church</CardTitle>
          <CardDescription>
            Create your headquarters church to get started with the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Church Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mito ya Baraka Church" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dar Es Salaam, Tanzania" {...field} />
                    </FormControl>
                    <FormDescription>
                      City and country where the church is located
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadPastorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Pastor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rev. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+254 700 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="church@example.com" {...field} />
                    </FormControl>
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
                        placeholder="Brief description about your church..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Church...' : 'Create Church'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
