import { getZones } from "@/actions/zone"
import { zones } from "@/db/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { contactInfoSchema } from "@/types/member"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ContactInfoData = {
  district: string
  ward: string
  street: string
  houseNumber?: string
  phone: string
  zoneId?: string
  landmark?: string
}

type ContactInfoStepProps = {
  data: ContactInfoData
  zones: any[]
  onSubmit: (data: ContactInfoData) => void
  onBack: () => void
}

export function ContactInfoStep({
  data,
  zones,
  onSubmit,
  onBack,
}: ContactInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ContactInfoData>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="district">District</Label>
        <Input id="district" {...register("district")} />
        {errors.district && (
          <p className="text-red-500">{errors.district.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="ward">Ward</Label>
        <Input id="ward" {...register("ward")} />
        {errors.ward && <p className="text-red-500">{errors.ward.message}</p>}
      </div>
      <div>
        <Label htmlFor="street">Street</Label>
        <Input id="street" {...register("street")} />
        {errors.street && (
          <p className="text-red-500">{errors.street.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="houseNumber">House Number</Label>
        <Input id="houseNumber" {...register("houseNumber")} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} />
        {errors.phone && <p className="text-red-500">{errors.phone.message}</p>}
      </div>
      <div>
        <Label htmlFor="zoneId">Zone</Label>
        <Controller
          name="zoneId"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(value) =>
                field.onChange(value === "no_zone" ? null : value)
              }
              value={field.value || "no_zone"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a zone (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_zone">No zone selected</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.zoneId && (
          <p className="text-red-500">{errors.zoneId.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="landmark">Landmark</Label>
        <Input id="landmark" {...register("landmark")} />
      </div>
      <div className="flex justify-between">
        <Button type="button" onClick={onBack}>
          Previous
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  )
}
