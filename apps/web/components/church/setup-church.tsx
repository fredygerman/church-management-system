'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { setupChurch } from '@/actions/church'
import { useT } from '@/components/i18n/locale-provider'
import type { Translate } from '@church/config'

function buildChurchFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(2, t('final.setup.nameMin')),
    location: z.string().min(2, t('final.setup.locationMin')),
    leadPastorName: z.string().min(2, t('final.setup.pastorMin')),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    description: z.string().optional(),
  }) as any
}

type ChurchFormValues = z.infer<ReturnType<typeof buildChurchFormSchema>>

interface SetupChurchProps {
  onSuccess?: (churchId: string) => void
}

export function SetupChurch({ onSuccess }: SetupChurchProps) {
  const { t } = useT()
  const churchFormSchema = buildChurchFormSchema(t)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(churchFormSchema) as any,
    defaultValues: {
      name: '',
      location: '',
      leadPastorName: '',
      phone: '',
      email: '',
      description: '',
    },
  })


  async function onSubmit(data: ChurchFormValues) {
    setIsLoading(true)
    setError(null)
    try {
      const result = await setupChurch({
        name: data.name,
        location: data.location,
        leadPastorName: data.leadPastorName,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
      })

      // After successful setup, authenticate with NextAuth using the returned tokens
      toast.success(t('final.setup.success'))
      
      // Sign in with the tokens returned from setup endpoint
      const signInResult = await signIn('credentials', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        redirect: false,
      })

      if (!signInResult?.ok) {
        throw new Error(t('final.setup.signInFailed'))
      }

      if (onSuccess) {
        onSuccess(result.church.id)
      }
      
      // Redirect to the church dashboard
      setTimeout(() => {
        router.push(`/${result.church.id}/dashboard`)
      }, 500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('final.setup.failed')
      console.error('Church setup error:', error)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl">{t('final.setup.title')}</CardTitle>
          <CardDescription>
            {t('final.setup.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('final.setup.nameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('final.setup.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('final.setup.locationLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('final.setup.locationPlaceholder')} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('final.setup.locationHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadPastorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('final.setup.pastorLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('final.setup.pastorPlaceholder')} {...field} />
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
                    <FormLabel>{t('final.setup.phoneLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder="+254 700 000 000" {...field} />
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
                    <FormLabel>{t('final.setup.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="church@example.com" {...field} />
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
                    <FormLabel>{t('final.setup.descriptionLabel')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('final.setup.descriptionPlaceholder')}
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('final.setup.creating') : t('final.setup.create')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
