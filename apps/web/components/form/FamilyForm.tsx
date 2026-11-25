'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFamily } from '@/actions/family'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useT } from '@/components/i18n/locale-provider'
import type { Translate } from '@church/config'

function buildFamilyFormSchema(t: Translate) {
  return z.object({
    familyName: z.string().min(2, t('final.family.nameMin')),
  })
}

type FamilyFormData = z.infer<ReturnType<typeof buildFamilyFormSchema>>

export function FamilyForm({ churchId }: { churchId: string }) {
  const { t } = useT()
  const familyFormSchema = buildFamilyFormSchema(t)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      familyName: '',
    },
  })

  const onSubmit = async (data: FamilyFormData) => {
    setIsSubmitting(true)
    try {
      await createFamily({
        churchId,
        familyName: data.familyName,
      })

      toast.success(t('final.family.success'))
      router.push(`/${churchId}/dashboard/families`)
    } catch (error) {
      console.error('Error creating family:', error)
      toast.error(
        error instanceof Error ? error.message : t('final.family.failed')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="familyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('final.family.label')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('final.family.placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              {isSubmitting ? t('final.family.adding') : t('final.family.add')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
