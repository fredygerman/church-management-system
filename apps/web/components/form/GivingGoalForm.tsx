"use client"

import { useState } from "react"
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

const givingGoalFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  targetAmount: z
    .string()
    .min(1, "Target amount is required")
    .refine((val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Target amount must be a positive number",
    }),
  currency: z.string().min(3, "Currency is required").max(3, "Use a 3-letter currency code"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPublic: z.boolean(),
})

type GivingGoalFormData = z.infer<typeof givingGoalFormSchema>

interface GivingGoalFormProps {
  churchId: string
  initialData?: any
  isEditMode?: boolean
}

export function GivingGoalForm({ churchId, initialData, isEditMode = false }: GivingGoalFormProps) {
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
        toast.success("Giving goal updated successfully!")
      } else {
        await createGivingGoal({ churchId, ...payload })
        toast.success("Giving goal created successfully!")
      }
      router.push(`/${churchId}/dashboard/offerings/goals`)
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
                <FormLabel>Goal Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., New Church Bus" {...field} />
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
                  <Textarea placeholder="The pitch shown to members" className="min-h-24" {...field} />
                </FormControl>
                <FormDescription>Optional description shown on the public goal listing</FormDescription>
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
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>Enter the target as a decimal value</FormDescription>
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Defaults to today if left blank</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Leave blank for an open-ended goal</FormDescription>
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
                  <FormLabel>Publicly visible</FormLabel>
                  <FormDescription>
                    Show this goal and its progress on the member portal
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : isEditMode ? "Update Goal" : "Create Goal"}
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
