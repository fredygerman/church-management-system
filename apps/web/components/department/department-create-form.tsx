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
import { createDepartment } from '@/actions/department'
import { useT } from '@/components/i18n/locale-provider'
import type { Translate } from '@church/config'

const departmentCreateSchema = (t: Translate) =>
  z.object({
    name: z.string().min(2, t('staff.departments.nameMinError')),
    description: z.string().optional(),
    meetingDay: z.string().optional(),
  })

type DepartmentCreateFormValues = z.infer<ReturnType<typeof departmentCreateSchema>>

interface DepartmentCreateFormProps {
  churchId: string
}

export function DepartmentCreateForm({ churchId }: DepartmentCreateFormProps) {
  const router = useRouter()
  const { t } = useT()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const schema = useMemo(() => departmentCreateSchema(t), [t])

  const form = useForm<DepartmentCreateFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: '',
      description: '',
      meetingDay: '',
    },
  })

  async function onSubmit(data: DepartmentCreateFormValues) {
    setIsSubmitting(true)
    try {
      await createDepartment({ churchId, ...data })
      toast.success(t('staff.departments.createSuccess'))
      router.push(`/${churchId}/dashboard/departments`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('staff.departments.createError')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('staff.departments.infoTitle')}</CardTitle>
        <CardDescription>
          {t('staff.departments.createInfoDescription')}
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
                  <FormLabel>{t('staff.departments.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('staff.departments.namePlaceholder')}
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
                    {t('staff.departments.meetingDayHelp')}
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
                      placeholder={t('staff.departments.descriptionPlaceholder')}
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('staff.departments.descriptionHelpCreate')}
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
                  t('staff.departments.create')
                )}
              </Button>
              <Link href={`/${churchId}/dashboard/departments`}>
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
