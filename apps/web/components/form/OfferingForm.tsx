"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createOffering, updateOffering } from "@/actions/offering"
import { centsFromDecimal } from "@/lib/utils"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

// No member/session picked -> sentinel value, stripped to undefined on submit
// (Radix Select does not allow an empty-string item value).
const UNSET = "none"

// Validation messages are translated, so the schema is built per locale.
function buildOfferingFormSchema(t: Translate) {
  return z.object({
    categoryId: z.string().min(1, t("sweep.a.offering.categoryRequired")),
    amount: z
      .string()
      .min(1, t("sweep.a.offering.amountRequired"))
      .refine((val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: t("sweep.a.offering.amountPositive"),
      }),
    currency: z
      .string()
      .min(3, t("sweep.a.form.currencyRequired"))
      .max(3, t("sweep.a.form.currencyCode")),
    offeringDate: z.string().min(1, t("sweep.a.offering.dateRequired")),
    memberId: z.string().optional(),
    sessionId: z.string().optional(),
    goalId: z.string().optional(),
    showOnDonorWall: z.boolean(),
    note: z.string().optional(),
  })
}

type OfferingFormData = z.infer<ReturnType<typeof buildOfferingFormSchema>>

interface OfferingFormProps {
  churchId: string
  categories: { id: string; name: string }[]
  members: { id: string; firstName?: string; lastName?: string }[]
  sessions: { id: string; title?: string; sessionDate?: string }[]
  goals: { id: string; name: string }[]
  initialData?: any
  isEditMode?: boolean
}

export function OfferingForm({
  churchId,
  categories,
  members,
  sessions,
  goals,
  initialData,
  isEditMode = false,
}: OfferingFormProps) {
  const { t } = useT()
  const offeringFormSchema = useMemo(() => buildOfferingFormSchema(t), [t])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<OfferingFormData>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
      amount:
        initialData?.amountCents !== undefined && initialData?.amountCents !== null
          ? (initialData.amountCents / 100).toFixed(2)
          : "",
      currency: initialData?.currency || "KES",
      offeringDate: initialData?.offeringDate ? String(initialData.offeringDate).slice(0, 10) : "",
      memberId: initialData?.memberId || UNSET,
      sessionId: initialData?.sessionId || UNSET,
      goalId: initialData?.goalId || UNSET,
      showOnDonorWall: initialData?.showOnDonorWall ?? false,
      note: initialData?.note || "",
    },
  })

  const memberId = form.watch("memberId")
  const hasMember = Boolean(memberId && memberId !== UNSET)

  // showOnDonorWall requires a named giver server-side - keep the checkbox
  // in sync when the member is cleared rather than letting it submit stale.
  useEffect(() => {
    if (!hasMember && form.getValues("showOnDonorWall")) {
      form.setValue("showOnDonorWall", false)
    }
  }, [hasMember, form])

  const onSubmit = async (data: OfferingFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        categoryId: data.categoryId,
        // Amount is collected as a decimal string in the UI; convert to
        // integer cents here - the API never receives a raw float amount.
        amountCents: centsFromDecimal(data.amount),
        currency: data.currency.toUpperCase(),
        offeringDate: data.offeringDate,
        memberId: data.memberId && data.memberId !== UNSET ? data.memberId : undefined,
        sessionId: data.sessionId && data.sessionId !== UNSET ? data.sessionId : undefined,
        // null (not undefined) so editing an offering can explicitly unlink a goal.
        goalId: data.goalId && data.goalId !== UNSET ? data.goalId : null,
        // Server-side rule: showOnDonorWall requires a non-null memberId.
        // The checkbox is disabled without a member, but guard here too.
        showOnDonorWall: hasMember ? data.showOnDonorWall : false,
        note: data.note || undefined,
      }

      if (isEditMode && initialData?.id) {
        await updateOffering(initialData.id, payload, churchId)
        toast.success(t("sweep.a.offering.updated"))
      } else {
        await createOffering({ churchId, ...payload })
        toast.success(t("sweep.a.offering.created"))
      }
      router.push(`/${churchId}/dashboard/offerings`)
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
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sweep.a.offering.categoryLabel")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("sweep.a.offering.selectCategory")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sweep.a.form.amount")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>{t("sweep.a.offering.amountHelp")}</FormDescription>
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

          <FormField
            control={form.control}
            name="offeringDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sweep.a.offering.dateLabel")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sweep.a.offering.memberLabel")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("sweep.a.offering.anonymous")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNSET}>{t("sweep.a.offering.anonymous")}</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{t("sweep.a.offering.memberHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sessionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sweep.a.offering.sessionLabel")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("sweep.a.offering.noSession")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNSET}>{t("sweep.a.offering.noSession")}</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title || session.sessionDate || session.id}
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
            name="goalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sweep.a.offering.goalLabel")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("sweep.a.offering.noGoal")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNSET}>{t("sweep.a.offering.noGoal")}</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{t("sweep.a.offering.goalHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showOnDonorWall"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!hasMember}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t("sweep.a.offering.donorWallLabel")}</FormLabel>
                  <FormDescription>
                    {hasMember
                      ? t("sweep.a.offering.donorWallOn")
                      : t("sweep.a.offering.donorWallOff")}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sweep.a.offering.noteLabel")}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t("sweep.a.offering.notePlaceholder")} className="min-h-24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? t("sweep.a.form.saving")
                : isEditMode
                ? t("sweep.a.offering.update")
                : t("sweep.a.offering.create")}
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
