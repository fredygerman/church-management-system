"use client"

import { useState } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { DashboardContent } from "./dashboard-content"

interface Church {
  id: string
  name: string
  location?: string
  imageUrl?: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  churches?: Church[]
  currentChurch?: Church | null
}

export function DashboardLayout({
  children,
  churches = [],
  currentChurch = null,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        churches={churches}
        currentChurch={currentChurch}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <DashboardHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        {/* Content */}
        <DashboardContent>{children}</DashboardContent>
      </div>
    </div>
  )
}
