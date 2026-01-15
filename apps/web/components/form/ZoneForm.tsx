"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createZone, updateZone } from "@/actions/zone"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const zoneFormSchema = z.object({
  name: z.string().min(2, "Zone name must be at least 2 characters"),
  description: z.string().optional(),
  meetingDay: z.string().optional(),
})

type ZoneFormData = z.infer<typeof zoneFormSchema>

interface ZoneFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export function ZoneForm({ churchId, initialData, isEditMode = false }: ZoneFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<ZoneFormData>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      meetingDay: initialData?.meetingDay || "",
    },
  })

  const onSubmit = async (data: ZoneFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && initialData?.id) {
        await updateZone(initialData.id, data)
        toast.success("Zone updated successfully!")
        router.push(`/${churchId}/dashboard/zones/${initialData.id}`)
      } else {
        const newZone = await createZone({
          churchId,
          ...data,
        })
        toast.success("Zone created successfully!")
        router.push(`/${churchId}/dashboard/zones/${newZone.id}`)
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
                <FormLabel>Meeting Day</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    placeholder="Enter zone description"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional description for the zone
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
                ? "Update Zone"
                : "Create Zone"}
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
