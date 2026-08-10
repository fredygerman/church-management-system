"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { createEvent, updateEvent } from "@/actions/event"
import { usePermission } from "@/hooks/use-permissions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// Naive timestamps only (no timezone column anywhere in this codebase yet -
// see docs/superpowers/specs/2026-08-10-calendar-events-design.md). The
// datetime-local value is sent through unchanged rather than round-tripped
// through Date/toISOString, which would shift it by the browser's UTC offset.
const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    location: z.string().optional(),
    startsAt: z.string().min(1, "Start date/time is required"),
    endsAt: z.string().optional(),
    scope: z.enum(["church", "network"]),
    status: z.enum(["draft", "published", "cancelled"]),
  })
  .refine((data) => !data.endsAt || data.endsAt >= data.startsAt, {
    message: "End must be after start",
    path: ["endsAt"],
  })

type EventFormData = z.infer<typeof eventFormSchema>

interface EventFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function EventForm({ churchId, initialData, isEditMode = false }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const canSetNetworkScope = usePermission("manage:network-events")

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      startsAt: initialData?.startsAt ? String(initialData.startsAt).slice(0, 16) : "",
      endsAt: initialData?.endsAt ? String(initialData.endsAt).slice(0, 16) : "",
      scope: initialData?.scope || "church",
      status: initialData?.status || "draft",
    },
  })

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        startsAt: data.startsAt,
        endsAt: data.endsAt || undefined,
        scope: canSetNetworkScope ? data.scope : "church" as const,
        status: data.status,
      }

      if (isEditMode && initialData?.id) {
        await updateEvent(initialData.id, payload, churchId)
        toast.success("Event updated successfully!")
      } else {
        await createEvent({ churchId, ...payload })
        toast.success("Event created successfully!")
      }
      router.push(`/${churchId}/dashboard/events`)
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Camp Meeting 2026" {...field} />
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
                  <Textarea placeholder="Optional description" className="min-h-24" {...field} />
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
                  <Input placeholder="Optional location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts At</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ends At (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>Leave blank for an open-ended event</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {canSetNetworkScope && (
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="church">This church only</SelectItem>
                      <SelectItem value="network">Whole network</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Network events are visible to every church once published.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Only published events are visible to members.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : isEditMode ? "Update Event" : "Create Event"}
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
