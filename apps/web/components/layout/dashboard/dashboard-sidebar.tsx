"use client"

import { CustomSidebar } from "@/components/layout/custom-sidebar"

interface Church {
  id: string
  name: string
  location?: string
  imageUrl?: string
}

interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
  churches?: Church[]
  currentChurch?: Church | null
}

export function DashboardSidebar({
  isOpen,
  onToggle,
  churches = [],
  currentChurch = null,
}: DashboardSidebarProps) {
  return (
    <CustomSidebar
      isOpen={isOpen}
      onToggle={onToggle}
      churches={churches}
      currentChurch={currentChurch}
    />
  )
}
