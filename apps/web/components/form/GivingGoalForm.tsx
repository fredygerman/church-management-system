"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createGivingGoal, updateGivingGoal } from "@/actions/giving-goal"
import { centsFromDecimal } from "@/lib/utils"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
function buildGivingGoalFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(2, t("sweep.a.goal.nameMin")),
    description: z.string().optional(),
    targetAmount: z
      .string()
      .min(1, t("sweep.a.goal.targetRequired"))
      .refine((val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: t("sweep.a.goal.targetPositive"),
      }),
    currency: z
      .string()
      .min(3, t("sweep.a.form.currencyRequired"))
      .max(3, t("sweep.a.form.currencyCode")),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isPublic: z.boolean(),
  })
}

type GivingGoalFormData = z.infer<ReturnType<typeof buildGivingGoalFormSchema>>

interface GivingGoalFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function GivingGoalForm({ churchId, initialData, isEditMode = false }: GivingGoalFormProps) {
  const { t } = useT()
  const givingGoalFormSchema = useMemo(() => buildGivingGoalFormSchema(t), [t])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<GivingGoalFormData>({
    resolver: zodResolver(givingGoalFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      targetAmount:
        initialData?.targetCents !== undefined && initialData?.targetCents !== null
          ? (initialData.targetCents / 100).toFixed(2)
          : "",
      currency: initialData?.currency || "KES",
      startDate: initialData?.startDate ? String(initialData.startDate).slice(0, 10) : "",
      endDate: initialData?.endDate ? String(initialData.endDate).slice(0, 10) : "",
      isPublic: initialData?.isPublic ?? true,
    },
  })

  const onSubmit = async (data: GivingGoalFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        // Target amount is collected as a decimal string in the UI; convert to
        // integer cents here - the API never receives a raw float amount.
        targetCents: centsFromDecimal(data.targetAmount),
        currency: data.currency.toUpperCase(),
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        isPublic: data.isPublic,
      }

      if (isEditMode && initialData?.id) {
        await updateGivingGoal(initialData.id, payload, churchId)
        toast.success(t("sweep.a.goal.updated"))
      } else {
        await createGivingGoal({ churchId, ...payload })
        toast.success(t("sweep.a.goal.created"))
      }
      router.push(`/${churchId}/dashboard/offerings/goals`)
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
                <FormLabel>{t("sweep.a.goal.nameLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("sweep.a.goal.namePlaceholder")} {...field} />
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
                  <Textarea placeholder={t("sweep.a.goal.descriptionPlaceholder")} className="min-h-24" {...field} />
                </FormControl>
                <FormDescription>{t("sweep.a.goal.descriptionHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sweep.a.goal.targetLabel")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>{t("sweep.a.goal.targetHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sweep.a.form.currency")}</FormLabel>
                  <FormControl>
                    <Input placeholder="KES" maxLength={3} {...field} />
                  </FormControl>
                  <FormDescription>{t("sweep.a.form.currencyHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sweep.a.form.startDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>{t("sweep.a.goal.startDateHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sweep.a.goal.endDateLabel")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>{t("sweep.a.goal.endDateHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t("sweep.a.goal.publicLabel")}</FormLabel>
                  <FormDescription>
                    {t("sweep.a.goal.publicHelp")}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? t("sweep.a.form.saving")
                : isEditMode
                ? t("sweep.a.goal.update")
                : t("sweep.a.goal.create")}
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
