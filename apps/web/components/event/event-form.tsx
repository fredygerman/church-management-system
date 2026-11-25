"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Translate } from "@church/config"

import { createEvent, updateEvent } from "@/actions/event"
import { usePermission } from "@/hooks/use-permissions"
import { useT } from "@/components/i18n/locale-provider"

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
// Validation messages are translated, so the schema is built per locale.
function buildEventFormSchema(t: Translate) {
  return z
    .object({
      title: z.string().min(1, t("staff.events.form.errorTitle")),
      description: z.string().optional(),
      location: z.string().optional(),
      startsAt: z.string().min(1, t("staff.events.form.errorStartsAt")),
      endsAt: z.string().optional(),
      scope: z.enum(["church", "network"]),
      status: z.enum(["draft", "published", "cancelled"]),
    })
    .refine((data) => !data.endsAt || data.endsAt >= data.startsAt, {
      message: t("staff.events.form.errorEndsAt"),
      path: ["endsAt"],
    })
}

type EventFormData = z.infer<ReturnType<typeof buildEventFormSchema>>

interface EventFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function EventForm({ churchId, initialData, isEditMode = false }: EventFormProps) {
  const { t } = useT()
  const eventFormSchema = useMemo(() => buildEventFormSchema(t), [t])
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
        toast.success(t("staff.events.form.updated"))
      } else {
        await createEvent({ churchId, ...payload })
        toast.success(t("staff.events.form.created"))
      }
      router.push(`/${churchId}/dashboard/events`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("staff.events.form.fallbackError"))
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
                <FormLabel>{t("staff.events.form.title")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("staff.events.form.titlePlaceholder")} {...field} />
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
                <FormLabel>{t("staff.events.form.description")}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t("staff.events.form.descriptionPlaceholder")} className="min-h-24" {...field} />
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
                <FormLabel>{t("staff.events.form.location")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("staff.events.form.locationPlaceholder")} {...field} />
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
                  <FormLabel>{t("staff.events.form.startsAt")}</FormLabel>
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
                  <FormLabel>{t("staff.events.form.endsAt")}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>{t("staff.events.form.endsAtHelp")}</FormDescription>
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
                  <FormLabel>{t("staff.events.form.scope")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("staff.events.form.scopePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="church">{t("staff.events.form.scopeChurch")}</SelectItem>
                      <SelectItem value="network">{t("staff.events.form.scopeNetwork")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{t("staff.events.form.scopeHelp")}</FormDescription>
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
                <FormLabel>{t("staff.events.form.status")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("staff.events.form.statusPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">{t("staff.events.status.draft")}</SelectItem>
                    <SelectItem value="published">{t("staff.events.status.published")}</SelectItem>
                    <SelectItem value="cancelled">{t("staff.events.status.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t("staff.events.form.statusHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t("common.saving") : isEditMode ? t("staff.events.form.update") : t("staff.events.create")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
