"use client"

interface DashboardContentProps {
  children: React.ReactNode
}

export function DashboardContent({ children }: DashboardContentProps) {
  return (
    <main className="flex-1 overflow-auto p-4 pb-24 md:p-8 md:pb-8">
      {children}
    </main>
  )
}
