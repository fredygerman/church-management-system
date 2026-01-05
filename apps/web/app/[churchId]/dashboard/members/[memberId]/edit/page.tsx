'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { getMemberById, updateMember } from '@/actions/member'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const memberEditSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  birthDate: z.string(),
  gender: z.enum(['Male', 'Female']),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
  joinedDate: z.string(),
})

type MemberEditFormValues = z.infer<typeof memberEditSchema>

interface Member {
  id: string
  fullName: string
  birthDate: string
  gender: 'Male' | 'Female'
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  joinedDate: string
  phone?: string
  email?: string
}

export default function MemberEditPage() {
  const router = useRouter()
  const params = useParams()
  const churchId = params.churchId as string
  const memberId = params.memberId as string

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<MemberEditFormValues>({
    resolver: zodResolver(memberEditSchema),
    defaultValues: {
      fullName: '',
      birthDate: '',
      gender: 'Male',
      maritalStatus: 'Single',
      joinedDate: '',
    },
  })

  useEffect(() => {
    async function loadMember() {
      try {
        setLoading(true)
        setError(null)
        const data = await getMemberById(memberId)
        setMember(data as Member)
        form.reset({
          fullName: data.fullName,
          birthDate: data.birthDate,
          gender: data.gender,
          maritalStatus: data.maritalStatus,
          joinedDate: data.joinedDate,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load member'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (memberId) {
      loadMember()
    }
  }, [memberId, form])

  async function onSubmit(data: MemberEditFormValues) {
    setIsSubmitting(true)
    try {
      await updateMember(memberId, data)
      toast.success('Member updated successfully!')
      router.push(`/${churchId}/dashboard/members/${memberId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">Loading member details...</p>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="mb-6">
          <Link href={`/${churchId}/dashboard/members/${memberId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error || 'Member not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/members/${memberId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Member</h1>
          <p className="text-gray-600">{member.fullName}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>
              Update the member's basic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
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
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
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
                      <FormLabel>Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joined Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        The date when this member joined the church
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
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Link href={`/${churchId}/dashboard/members/${memberId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
