import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { useMemo } from "react"

import { buildPersonalInfoSchema } from "@/types/member"
import { useT } from "@/components/i18n/locale-provider"
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
  firstName: string
  lastName: string
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
  const { t } = useT()
  const schema = useMemo(() => buildPersonalInfoSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(schema as any),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{t("final.form.firstName")}</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName && (
            <p className="text-red-500">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">{t("final.form.lastName")}</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName && (
            <p className="text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="birthDate">{t("final.form.birthDate")}</Label>
        <Input id="birthDate" type="date" {...register("birthDate")} />
        {errors.birthDate && (
          <p className="text-red-500">{errors.birthDate.message}</p>
        )}
      </div>
      <div>
        <Label>{t("final.form.gender")}</Label>
        <RadioGroup defaultValue={data.gender}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Male" id="male" {...register("gender")} />
            <Label htmlFor="male">{t("final.form.male")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="Female"
              id="female"
              {...register("gender")}
            />
            <Label htmlFor="female">{t("final.form.female")}</Label>
          </div>
        </RadioGroup>
        {errors.gender && (
          <p className="text-red-500">{errors.gender.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="maritalStatus">{t("final.form.maritalStatus")}</Label>
        <Controller
          name="maritalStatus"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={t("final.form.selectMaritalStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">{t("final.form.single")}</SelectItem>
                <SelectItem value="Married">{t("final.form.married")}</SelectItem>
                <SelectItem value="Divorced">{t("final.form.divorced")}</SelectItem>
                <SelectItem value="Widowed">{t("final.form.widowed")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.maritalStatus && (
          <p className="text-red-500">{errors.maritalStatus.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="birthPlace">{t("final.form.birthPlace")}</Label>
        <Input id="birthPlace" {...register("birthPlace")} />
      </div>
      <div>
        <Label htmlFor="occupation">{t("final.form.occupation")}</Label>
        <Input id="occupation" {...register("occupation")} />
      </div>
      <div>
        <Label htmlFor="tribe">{t("final.form.tribe")}</Label>
        <Input id="tribe" {...register("tribe")} />
      </div>
      <Button type="submit">{t("final.form.next")}</Button>
    </form>
  )
}
