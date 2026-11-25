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
import { z } from 'zod'
import { updateZone } from '@/actions/zone'
import type { Zone } from '@church/db'
import type { Translate } from '@church/config'
import { useT } from '@/components/i18n/locale-provider'

const zoneEditSchema = (t: Translate) =>
  z.object({
    name: z.string().min(2, t('staff.zones.nameMinError')),
    description: z.string().optional(),
    meetingDay: z.string().optional(),
  })

type ZoneEditFormValues = z.infer<ReturnType<typeof zoneEditSchema>>

interface ZoneEditFormProps {
  zone: Zone
  churchId: string
}

export function ZoneEditForm({ zone, churchId }: ZoneEditFormProps) {
  const router = useRouter()
  const { t } = useT()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const schema = useMemo(() => zoneEditSchema(t), [t])

  const form = useForm<ZoneEditFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: zone.name,
      description: zone.description || '',
      meetingDay: zone.meetingDay || '',
    },
  })

  async function onSubmit(data: ZoneEditFormValues) {
    setIsSubmitting(true)
    try {
      await updateZone(zone.id, data, churchId)
      toast.success(t('staff.zones.updateSuccess'))
      router.push(`/${churchId}/dashboard/zones/${zone.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('staff.zones.updateError')
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
          {t('staff.zones.editInfoDescription')}
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
                    <Input placeholder={t('staff.zones.namePlaceholderEdit')} {...field} />
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
                    {t('staff.zones.descriptionHelpEdit')}
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
                    {t('common.saving')}
                  </>
                ) : (
                  t('staff.zones.saveChanges')
                )}
              </Button>
              <Link href={`/${churchId}/dashboard/zones/${zone.id}`}>
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
