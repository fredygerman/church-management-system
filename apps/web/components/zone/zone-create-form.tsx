'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from 'lucide-react'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createZone } from '@/actions/zone'
import { useT } from '@/components/i18n/locale-provider'
import type { Translate } from '@church/config'

const zoneCreateSchema = (t: Translate) =>
  z.object({
    name: z.string().min(2, t('staff.zones.nameMinError')),
    description: z.string().optional(),
    meetingDay: z.string().optional(),
  })

type ZoneCreateFormValues = z.infer<ReturnType<typeof zoneCreateSchema>>

interface ZoneCreateFormProps {
  churchId: string
}

export function ZoneCreateForm({ churchId }: ZoneCreateFormProps) {
  const router = useRouter()
  const { t } = useT()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const schema = useMemo(() => zoneCreateSchema(t), [t])

  const form = useForm<ZoneCreateFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: '',
      description: '',
      meetingDay: '',
    },
  })

  async function onSubmit(data: ZoneCreateFormValues) {
    setIsSubmitting(true)
    try {
      await createZone({ churchId, ...data })
      toast.success(t('staff.zones.createSuccess'))
      router.push(`/${churchId}/dashboard/zones`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('staff.zones.createError')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('staff.zones.infoTitle')}</CardTitle>
        <CardDescription>
          {t('staff.zones.createInfoDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('staff.zones.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('staff.zones.namePlaceholderCreate')}
                      {...field}
                    />
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
                  <FormLabel>{t('staff.groups.meetingDayOptional')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('staff.groups.meetingDayPlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('staff.zones.meetingDayHelp')}
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
                  <FormLabel>{t('staff.groups.descriptionOptional')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('staff.zones.descriptionPlaceholder')}
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('staff.zones.descriptionHelpCreate')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {t('staff.groups.creating')}
                  </>
                ) : (
                  t('staff.zones.create')
                )}
              </Button>
              <Link href={`/${churchId}/dashboard/zones`}>
                <Button type="button" variant="outline">
                  {t('common.cancel')}
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
