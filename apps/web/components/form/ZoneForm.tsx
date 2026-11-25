"use client"

import { useMemo, useState } from "react"
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
import type { Translate } from "@church/config"
import { useT } from "@/components/i18n/locale-provider"

// Validation messages are translated, so the schema is built per locale.
function buildZoneFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(2, t("sweep.a.zone.nameMin")),
    description: z.string().optional(),
    meetingDay: z.string().optional(),
  })
}

type ZoneFormData = z.infer<ReturnType<typeof buildZoneFormSchema>>

interface ZoneFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

// Values are stored in English; only the labels are translated.
const daysOfWeek = [
  { value: "Monday", labelKey: "sweep.a.day.monday" },
  { value: "Tuesday", labelKey: "sweep.a.day.tuesday" },
  { value: "Wednesday", labelKey: "sweep.a.day.wednesday" },
  { value: "Thursday", labelKey: "sweep.a.day.thursday" },
  { value: "Friday", labelKey: "sweep.a.day.friday" },
  { value: "Saturday", labelKey: "sweep.a.day.saturday" },
  { value: "Sunday", labelKey: "sweep.a.day.sunday" },
] as const

export function ZoneForm({ churchId, initialData, isEditMode = false }: ZoneFormProps) {
  const { t } = useT()
  const zoneFormSchema = useMemo(() => buildZoneFormSchema(t), [t])
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
        await updateZone(initialData.id, data, churchId)
        toast.success(t("sweep.a.zone.updated"))
        router.push(`/${churchId}/dashboard/zones/${initialData.id}`)
      } else {
        const newZone = await createZone({
          churchId,
          ...data,
        })
        toast.success(t("sweep.a.zone.created"))
        router.push(`/${churchId}/dashboard/zones/${newZone.id}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("sweep.a.form.genericError"))
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
                <FormLabel>{t("sweep.a.zone.nameLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("sweep.a.zone.namePlaceholder")} {...field} />
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
                <FormLabel>{t("sweep.a.form.meetingDay")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("sweep.a.form.selectDay")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {t(day.labelKey)}
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
                <FormLabel>{t("sweep.a.form.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("sweep.a.zone.descriptionPlaceholder")}
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("sweep.a.zone.descriptionHelp")}
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
                ? t("sweep.a.form.saving")
                : isEditMode
                ? t("sweep.a.zone.update")
                : t("sweep.a.zone.create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              {t("sweep.a.form.cancel")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
