"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createVisitor } from "@/actions/visitor"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/components/i18n/locale-provider"
import type { Translate } from "@church/config"

function buildVisitorFormSchema(t: Translate) {
  return z.object({
    firstName: z.string().min(2, t("final.visitor.firstNameMin")),
    lastName: z.string().min(2, t("final.visitor.lastNameMin")),
    email: z.string().optional(),
    phone: z.string().optional(),
    visitorSource: z.enum([
      "friend",
      "flyer",
      "walk_in",
      "event",
      "referral",
      "social_media",
      "other",
    ]),
    visitDate: z.string().optional(),
  })
}

type VisitorFormData = z.infer<ReturnType<typeof buildVisitorFormSchema>>

export function VisitorForm({ churchId }: { churchId: string }) {
  const { t } = useT()
  const visitorFormSchema = buildVisitorFormSchema(t)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<VisitorFormData>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      visitorSource: "walk_in",
      visitDate: new Date().toISOString().split("T")[0],
    },
  })

  const onSubmit = async (data: VisitorFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createVisitor({
        churchId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        visitDate: data.visitDate || new Date().toISOString().split("T")[0],
        visitorSource: data.visitorSource,
      })

      toast.success(t("final.visitor.success"))
      router.push(`/${churchId}/dashboard/visitors`)
    } catch (error) {
      console.error("Error creating visitor:", error)
      toast.error(
        error instanceof Error ? error.message : t("final.visitor.failed")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("final.visitor.firstNameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("final.visitor.lastNameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("final.form.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("final.form.phone")}</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="visitDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("final.visitor.visitDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visitorSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("final.visitor.source")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("final.visitor.selectSource")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="friend">{t("final.visitor.friend")}</SelectItem>
                      <SelectItem value="flyer">{t("final.visitor.flyer")}</SelectItem>
                      <SelectItem value="walk_in">{t("final.visitor.walkIn")}</SelectItem>
                      <SelectItem value="event">{t("final.visitor.event")}</SelectItem>
                      <SelectItem value="referral">{t("final.visitor.referral")}</SelectItem>
                      <SelectItem value="social_media">{t("final.visitor.socialMedia")}</SelectItem>
                      <SelectItem value="other">{t("final.visitor.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("final.visitor.adding") : t("final.visitor.add")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
