"use client"

import { useMemo, useState } from "react"
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
import type { Translate } from "@church/config"
import { useT } from "@/components/i18n/locale-provider"

// Validation messages are translated, so the schema is built per locale.
function buildDepartmentFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(2, t("sweep.a.department.nameMin")),
    description: z.string().optional(),
    meetingDay: z.string().optional(),
  })
}

type DepartmentFormData = z.infer<ReturnType<typeof buildDepartmentFormSchema>>

interface DepartmentFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function DepartmentForm({ churchId, initialData, isEditMode = false }: DepartmentFormProps) {
  const { t } = useT()
  const departmentFormSchema = useMemo(() => buildDepartmentFormSchema(t), [t])
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
        toast.success(t("sweep.a.department.updated"))
        router.push(`/${churchId}/dashboard/departments/${initialData.id}`)
      } else {
        const newDepartment = await createDepartment({
          churchId,
          ...data,
        })
        toast.success(t("sweep.a.department.created"))
        router.push(`/${churchId}/dashboard/departments/${newDepartment.id}`)
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
                <FormLabel>{t("sweep.a.department.nameLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("sweep.a.department.namePlaceholder")} {...field} />
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
                <FormControl>
                  <Input placeholder={t("sweep.a.form.meetingDayPlaceholder")} {...field} />
                </FormControl>
                <FormDescription>
                  {t("sweep.a.department.meetingDayHelp")}
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
                <FormLabel>{t("sweep.a.form.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("sweep.a.department.descriptionPlaceholder")}
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("sweep.a.department.descriptionHelp")}
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
                ? t("sweep.a.department.update")
                : t("sweep.a.department.create")}
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
