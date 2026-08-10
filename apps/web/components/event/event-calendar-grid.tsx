"use client"

import { useRouter, usePathname } from "next/navigation"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

interface EventCalendarGridProps {
  selectedDate: string // yyyy-MM-dd
  visibleMonth: string // yyyy-MM
  eventDates: string[] // yyyy-MM-dd
  serviceDates: string[] // yyyy-MM-dd
}

export function EventCalendarGrid({
  selectedDate,
  visibleMonth,
  eventDates,
  serviceDates,
}: EventCalendarGridProps) {
  const router = useRouter()
  const pathname = usePathname()

  function goto(date: string, month: string) {
    router.push(`${pathname}?date=${date}&month=${month}`)
  }

  return (
    <Calendar
      mode="single"
      selected={new Date(`${selectedDate}T00:00:00`)}
      month={new Date(`${visibleMonth}-01T00:00:00`)}
      onSelect={(day) => {
        if (!day) return
        goto(format(day, "yyyy-MM-dd"), format(day, "yyyy-MM"))
      }}
      onMonthChange={(month) => goto(selectedDate, format(month, "yyyy-MM"))}
      modifiers={{
        hasEvent: eventDates.map((d) => new Date(`${d}T00:00:00`)),
        hasService: serviceDates.map((d) => new Date(`${d}T00:00:00`)),
      }}
      modifiersClassNames={{
        hasEvent: "font-bold underline decoration-2 decoration-primary underline-offset-4",
        hasService: "ring-1 ring-inset ring-muted-foreground/40",
      }}
      className="rounded-md border"
    />
  )
}
