"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

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
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/components/i18n/locale-provider"
import type { Translate } from "@church/config"

function buildFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(2, {
      message: t("final.support.nameMin"),
    }),
    email: z.string().email({
      message: t("final.support.emailInvalid"),
    }),
    message: z.string().min(10, {
      message: t("final.support.messageMin"),
    }),
  })
}

export function SupportForm() {
  const { t } = useT()
  const formSchema = buildFormSchema(t)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.error(t("final.support.unavailableToast"))
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          {t("final.support.unavailableNotice")}
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 opacity-50 pointer-events-none"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("final.support.name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("final.support.namePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("final.support.email")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("final.support.emailPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("final.support.message")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("final.support.messagePlaceholder")}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled>{t("final.support.send")}</Button>
        </form>
      </Form>
    </div>
  )
}
