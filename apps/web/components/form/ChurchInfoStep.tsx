import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { useMemo } from "react"

import { buildChurchInfoSchema } from "@/types/member"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/components/i18n/locale-provider"

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
  const { t } = useT()
  const schema = useMemo(() => buildChurchInfoSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ChurchInfoData>({
    resolver: zodResolver(schema as any),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="joinedDate">{t("final.form.joinedDate")}</Label>
        <Input id="joinedDate" type="date" {...register("joinedDate")} />
        {errors.joinedDate && (
          <p className="text-red-500">{errors.joinedDate.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="salvationDate">{t("final.form.salvationDate")}</Label>
        <Input id="salvationDate" type="date" {...register("salvationDate")} />
        {errors.salvationDate && (
          <p className="text-red-500">{errors.salvationDate.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="baptismDate">{t("final.form.baptismDate")}</Label>
        <Input id="baptismDate" type="date" {...register("baptismDate")} />
        {errors.baptismDate && (
          <p className="text-red-500">{errors.baptismDate.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="anointedDate">{t("final.form.anointedDate")}</Label>
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
        <Label htmlFor="holySpirit">{t("final.form.holySpirit")}</Label>
      </div>
      {errors.holySpirit && (
        <p className="text-red-500">{errors.holySpirit.message}</p>
      )}
      <div className="flex justify-between">
        <Button type="button" onClick={onBack}>
          {t("final.form.previous")}
        </Button>
        <Button type="submit">{t("final.form.next")}</Button>
      </div>
    </form>
  )
}
