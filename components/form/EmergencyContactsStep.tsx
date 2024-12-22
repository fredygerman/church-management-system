import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { emergencyContactSchema } from "@/types/member"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type EmergencyContactData = {
  name?: string
  relation?: string
  phone?: string
  address?: string
}

type EmergencyContactsData = {
  emergencyContact1: EmergencyContactData
  emergencyContact2: EmergencyContactData
}

type EmergencyContactsStepProps = {
  data: EmergencyContactsData
  onSubmit: (data: EmergencyContactsData) => void
  onBack: () => void
}

export function EmergencyContactsStep({
  data,
  onSubmit,
  onBack,
}: EmergencyContactsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmergencyContactsData>({
    resolver: zodResolver(
      z.object({
        emergencyContact1: emergencyContactSchema.optional(),
        emergencyContact2: emergencyContactSchema.optional(),
      })
    ),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Emergency Contact 1</h3>
        <div>
          <Label htmlFor="ec1Name">Name</Label>
          <Input id="ec1Name" {...register("emergencyContact1.name")} />
          {errors.emergencyContact1?.name && (
            <p className="text-red-500">
              {errors.emergencyContact1.name.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec1Relation">Relation</Label>
          <Input id="ec1Relation" {...register("emergencyContact1.relation")} />
          {errors.emergencyContact1?.relation && (
            <p className="text-red-500">
              {errors.emergencyContact1.relation.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec1Phone">Phone</Label>
          <Input id="ec1Phone" {...register("emergencyContact1.phone")} />
          {errors.emergencyContact1?.phone && (
            <p className="text-red-500">
              {errors.emergencyContact1.phone.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec1Address">Address</Label>
          <Input id="ec1Address" {...register("emergencyContact1.address")} />
          {errors.emergencyContact1?.address && (
            <p className="text-red-500">
              {errors.emergencyContact1.address.message}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Emergency Contact 2</h3>
        <div>
          <Label htmlFor="ec2Name">Name</Label>
          <Input id="ec2Name" {...register("emergencyContact2.name")} />
          {errors.emergencyContact2?.name && (
            <p className="text-red-500">
              {errors.emergencyContact2.name.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec2Relation">Relation</Label>
          <Input id="ec2Relation" {...register("emergencyContact2.relation")} />
          {errors.emergencyContact2?.relation && (
            <p className="text-red-500">
              {errors.emergencyContact2.relation.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec2Phone">Phone</Label>
          <Input id="ec2Phone" {...register("emergencyContact2.phone")} />
          {errors.emergencyContact2?.phone && (
            <p className="text-red-500">
              {errors.emergencyContact2.phone.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec2Address">Address</Label>
          <Input id="ec2Address" {...register("emergencyContact2.address")} />
          {errors.emergencyContact2?.address && (
            <p className="text-red-500">
              {errors.emergencyContact2.address.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between">
        <Button type="button" onClick={onBack}>
          Previous
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  )
}
