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
import { createDepartment } from '@/actions/department'

const departmentCreateSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  meetingDay: z.string().optional(),
})

type DepartmentCreateFormValues = z.infer<typeof departmentCreateSchema>

interface DepartmentCreateFormProps {
  churchId: string
}

export function DepartmentCreateForm({ churchId }: DepartmentCreateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DepartmentCreateFormValues>({
    resolver: zodResolver(departmentCreateSchema as any),
    defaultValues: {
      name: '',
      description: '',
      meetingDay: '',
    },
  })

  async function onSubmit(data: DepartmentCreateFormValues) {
    setIsSubmitting(true)
    try {
      await createDepartment({ churchId, ...data })
      toast.success('Department created successfully!')
      router.push(`/${churchId}/dashboard/departments`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Information</CardTitle>
        <CardDescription>
          Enter the details for the new department
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
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Choir, Ushers, Intercessors"
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
                    The day this department meets
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
                      placeholder="Enter department description..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about this department (e.g., purpose, activities)
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
                  'Create Department'
                )}
              </Button>
              <Link href={`/${churchId}/dashboard/departments`}>
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
