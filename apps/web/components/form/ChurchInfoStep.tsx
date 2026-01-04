import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { churchInfoSchema } from "@/types/member"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ChurchInfoData = {
  salvationDate?: string
  baptismDate?: string
  anointedDate?: string
  joinedDate: string
  holySpirit: boolean
}

type ChurchInfoStepProps = {
  data: ChurchInfoData
  onSubmit: (data: ChurchInfoData) => void
  onBack: () => void
}

export function ChurchInfoStep({
  data,
  onSubmit,
  onBack,
}: ChurchInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ChurchInfoData>({
    resolver: zodResolver(churchInfoSchema),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="joinedDate">Joined Date</Label>
        <Input id="joinedDate" type="date" {...register("joinedDate")} />
        {errors.joinedDate && (
          <p className="text-red-500">{errors.joinedDate.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="salvationDate">Salvation Date</Label>
        <Input id="salvationDate" type="date" {...register("salvationDate")} />
        {errors.salvationDate && (
          <p className="text-red-500">{errors.salvationDate.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="baptismDate">Baptism Date</Label>
        <Input id="baptismDate" type="date" {...register("baptismDate")} />
        {errors.baptismDate && (
          <p className="text-red-500">{errors.baptismDate.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="anointedDate">Anointed Date</Label>
        <Input id="anointedDate" type="date" {...register("anointedDate")} />
        {errors.anointedDate && (
          <p className="text-red-500">{errors.anointedDate.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="holySpirit"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="holySpirit"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="holySpirit">Filled with Holy Spirit</Label>
      </div>
      {errors.holySpirit && (
        <p className="text-red-500">{errors.holySpirit.message}</p>
      )}
      <div className="flex justify-between">
        <Button type="button" onClick={onBack}>
          Previous
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  )
}
