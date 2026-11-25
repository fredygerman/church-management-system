'use client'

import { useState } from 'react'
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/components/i18n/locale-provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { updateMember } from '@/actions/member'
import type { Member } from '@church/db'
import type { Translate } from '@church/config'

function memberEditSchema(t: Translate) {
  return z.object({
    firstName: z.string().min(1, t('staff.form.firstNameRequired')),
    lastName: z.string().min(1, t('staff.form.lastNameRequired')),
    dateOfBirth: z.string(),
    gender: z.enum(['male', 'female', 'others']),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  })
}

type MemberEditFormValues = z.infer<ReturnType<typeof memberEditSchema>>

interface MemberEditFormProps {
  member: Member
  churchId: string
}

export function MemberEditForm({ member, churchId }: MemberEditFormProps) {
  const router = useRouter()
  const { t } = useT()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MemberEditFormValues>({
    resolver: zodResolver(memberEditSchema(t) as any),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth || '',
      gender: (member.gender as 'male' | 'female' | 'others') || 'male',
      maritalStatus: (member.maritalStatus as 'single' | 'married' | 'divorced' | 'widowed') || 'single',
    },
  })

  async function onSubmit(data: MemberEditFormValues) {
    setIsSubmitting(true)
    try {
      await updateMember(churchId, member.id, data)
      toast.success(t('staff.form.memberUpdated'))
      router.push(`/${churchId}/dashboard/members/${member.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('staff.form.memberUpdateFailed')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('staff.form.memberInformation')}</CardTitle>
        <CardDescription>
          {t('staff.form.memberInformationDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('staff.form.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('staff.form.enterFirstName')} {...field} />
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
                    <FormLabel>{t('staff.form.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('staff.form.enterLastName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('staff.form.dateOfBirth')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('staff.form.gender')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('staff.form.selectGender')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">{t('staff.form.genderMale')}</SelectItem>
                        <SelectItem value="female">{t('staff.form.genderFemale')}</SelectItem>
                        <SelectItem value="others">{t('staff.form.genderOthers')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('staff.form.maritalStatus')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('staff.form.selectMaritalStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">{t('staff.form.maritalSingle')}</SelectItem>
                      <SelectItem value="married">{t('staff.form.maritalMarried')}</SelectItem>
                      <SelectItem value="divorced">{t('staff.form.maritalDivorced')}</SelectItem>
                      <SelectItem value="widowed">{t('staff.form.maritalWidowed')}</SelectItem>
                    </SelectContent>
                  </Select>
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
                  t('staff.form.saveChanges')
                )}
              </Button>
              <Link href={`/${churchId}/dashboard/members/${member.id}`}>
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
