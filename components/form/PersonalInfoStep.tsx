import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { personalInfoSchema } from "@/types/member"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PersonalInfoData = {
  fullName: string
  birthDate: string
  gender: "Male" | "Female"
  maritalStatus: "Married" | "Single" | "Divorced" | "Widowed"
  birthPlace?: string
  occupation?: string
  tribe?: string
}

type PersonalInfoStepProps = {
  data: PersonalInfoData
  onSubmit: (data: PersonalInfoData) => void
}

export function PersonalInfoStep({ data, onSubmit }: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && (
          <p className="text-red-500">{errors.fullName.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="birthDate">Birth Date</Label>
        <Input id="birthDate" type="date" {...register("birthDate")} />
        {errors.birthDate && (
          <p className="text-red-500">{errors.birthDate.message}</p>
        )}
      </div>
      <div>
        <Label>Gender</Label>
        <RadioGroup defaultValue={data.gender}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Male" id="male" {...register("gender")} />
            <Label htmlFor="male">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="Female"
              id="female"
              {...register("gender")}
            />
            <Label htmlFor="female">Female</Label>
          </div>
        </RadioGroup>
        {errors.gender && (
          <p className="text-red-500">{errors.gender.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="maritalStatus">Marital Status</Label>
        <Controller
          name="maritalStatus"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.maritalStatus && (
          <p className="text-red-500">{errors.maritalStatus.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="birthPlace">Birth Place</Label>
        <Input id="birthPlace" {...register("birthPlace")} />
      </div>
      <div>
        <Label htmlFor="occupation">Occupation</Label>
        <Input id="occupation" {...register("occupation")} />
      </div>
      <div>
        <Label htmlFor="tribe">Tribe</Label>
        <Input id="tribe" {...register("tribe")} />
      </div>
      <Button type="submit">Next</Button>
    </form>
  )
}
