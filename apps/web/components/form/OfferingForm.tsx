"use client"

import { useEffect, useState } from "react"
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

// No member/session picked -> sentinel value, stripped to undefined on submit
// (Radix Select does not allow an empty-string item value).
const UNSET = "none"

const offeringFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  currency: z.string().min(3, "Currency is required").max(3, "Use a 3-letter currency code"),
  offeringDate: z.string().min(1, "Date is required"),
  memberId: z.string().optional(),
  sessionId: z.string().optional(),
  goalId: z.string().optional(),
  showOnDonorWall: z.boolean(),
  note: z.string().optional(),
})

type OfferingFormData = z.infer<typeof offeringFormSchema>

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
        toast.success("Offering updated successfully!")
      } else {
        await createOffering({ churchId, ...payload })
        toast.success("Offering recorded successfully!")
      }
      router.push(`/${churchId}/dashboard/offerings`)
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
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>Enter the amount as a decimal value</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="KES" maxLength={3} {...field} />
                  </FormControl>
                  <FormDescription>ISO code, e.g. KES, USD</FormDescription>
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
                <FormLabel>Offering Date</FormLabel>
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
                <FormLabel>Member (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Anonymous / basket total" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNSET}>Anonymous / basket total</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Leave unset for anonymous or basket contributions</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sessionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Session (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Not linked to a session" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNSET}>Not linked to a session</SelectItem>
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
                <FormLabel>Count Toward Goal (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Not linked to a goal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNSET}>Not linked to a goal</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Link this offering to a fundraising goal&apos;s progress</FormDescription>
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
                  <FormLabel>Show on donor wall</FormLabel>
                  <FormDescription>
                    {hasMember
                      ? "Recognize this giver by name on the public donor wall (never shows the amount)"
                      : "Select a member to enable public recognition"}
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
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional note" className="min-h-24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : isEditMode ? "Update Offering" : "Record Offering"}
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
