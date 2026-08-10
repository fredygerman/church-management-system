"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDepartment, updateDepartment } from "@/actions/department"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const departmentFormSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
  meetingDay: z.string().optional(),
})

type DepartmentFormData = z.infer<typeof departmentFormSchema>

interface DepartmentFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function DepartmentForm({ churchId, initialData, isEditMode = false }: DepartmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      meetingDay: initialData?.meetingDay || "",
    },
  })

  const onSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && initialData?.id) {
        await updateDepartment(initialData.id, data, churchId)
        toast.success("Department updated successfully!")
        router.push(`/${churchId}/dashboard/departments/${initialData.id}`)
      } else {
        const newDepartment = await createDepartment({
          churchId,
          ...data,
        })
        toast.success("Department created successfully!")
        router.push(`/${churchId}/dashboard/departments/${newDepartment.id}`)
      }
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
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department name" {...field} />
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
                <FormLabel>Meeting Day</FormLabel>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter department description"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional description for the department
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Update Department"
                : "Create Department"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
