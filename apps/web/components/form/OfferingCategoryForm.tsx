"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOfferingCategory, updateOfferingCategory } from "@/actions/offering"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const offeringCategoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
})

type OfferingCategoryFormData = z.infer<typeof offeringCategoryFormSchema>

interface OfferingCategoryFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function OfferingCategoryForm({ churchId, initialData, isEditMode = false }: OfferingCategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<OfferingCategoryFormData>({
    resolver: zodResolver(offeringCategoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  })

  const onSubmit = async (data: OfferingCategoryFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && initialData?.id) {
        await updateOfferingCategory(initialData.id, data, churchId)
        toast.success("Category updated successfully!")
      } else {
        await createOfferingCategory({ churchId, ...data })
        toast.success("Category created successfully!")
      }
      router.push(`/${churchId}/dashboard/offerings/categories`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Tithe, Building Fund, Missions" {...field} />
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter category description"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional description for the category</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : isEditMode ? "Update Category" : "Create Category"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
