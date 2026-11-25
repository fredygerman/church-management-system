"use client"

import { useMemo, useState } from "react"
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
import type { Translate } from "@church/config"
import { useT } from "@/components/i18n/locale-provider"

// Validation messages are translated, so the schema is built per locale.
function buildOfferingCategoryFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(2, t("sweep.a.category.nameMin")),
    description: z.string().optional(),
  })
}

type OfferingCategoryFormData = z.infer<ReturnType<typeof buildOfferingCategoryFormSchema>>

interface OfferingCategoryFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function OfferingCategoryForm({ churchId, initialData, isEditMode = false }: OfferingCategoryFormProps) {
  const { t } = useT()
  const offeringCategoryFormSchema = useMemo(() => buildOfferingCategoryFormSchema(t), [t])
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
        toast.success(t("sweep.a.category.updated"))
      } else {
        await createOfferingCategory({ churchId, ...data })
        toast.success(t("sweep.a.category.created"))
      }
      router.push(`/${churchId}/dashboard/offerings/categories`)
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
                <FormLabel>{t("sweep.a.category.nameLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("sweep.a.category.namePlaceholder")} {...field} />
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
                <FormLabel>{t("sweep.a.form.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("sweep.a.category.descriptionPlaceholder")}
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("sweep.a.category.descriptionHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? t("sweep.a.form.saving")
                : isEditMode
                ? t("sweep.a.category.update")
                : t("sweep.a.category.create")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              {t("sweep.a.form.cancel")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
