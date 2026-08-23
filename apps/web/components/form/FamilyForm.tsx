'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFamily } from '@/actions/family'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const familyFormSchema = z.object({
  familyName: z.string().min(2, 'Family name must be at least 2 characters'),
})

type FamilyFormData = z.infer<typeof familyFormSchema>

export function FamilyForm({ churchId }: { churchId: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      familyName: '',
    },
  })

  const onSubmit = async (data: FamilyFormData) => {
    setIsSubmitting(true)
    try {
      await createFamily({
        churchId,
        familyName: data.familyName,
      })

      toast.success('Family added successfully!')
      router.push(`/${churchId}/dashboard/families`)
    } catch (error) {
      console.error('Error creating family:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to add family'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="familyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter family name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Family'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
