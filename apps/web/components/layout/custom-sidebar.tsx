"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { sidebarConfig } from "@/config/sidebar"
import { ChurchSwitcher } from "@/components/layout/church-switcher"

interface Church {
  id: string
  name: string
  location?: string
  imageUrl?: string
}

interface CustomSidebarProps {
  isOpen: boolean
  onToggle: () => void
  churches?: Church[]
  currentChurch?: Church | null
}

export function CustomSidebar({
  isOpen,
  onToggle,
  churches = [],
  currentChurch = null,
}: CustomSidebarProps) {
  const { churchId } = useParams()
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(sidebarConfig.map((section) => section.title))
  )

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background border-r border-border transition-transform duration-300 ease-in-out flex flex-col",
          // Mobile: full width, translate based on isOpen state
          "w-screen md:w-64",
          // Mobile translation
          "md:relative md:translate-x-0 md:inset-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible and static
          "lg:static lg:w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/50">
          <h2 className="text-lg font-bold text-foreground">Church Manager</h2>
          <button
            onClick={onToggle}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Church Switcher */}
        {churches && churches.length > 0 && (
          <div className="border-b border-border px-4 py-4 bg-muted/30">
            <ChurchSwitcher
              churches={churches}
              currentChurch={currentChurch}
            />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-4">
            {sidebarConfig.map((section) => {
              const isExpanded = expandedSections.has(section.title)

              return (
                <div key={section.title}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {section.title}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  {/* Section Items */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1">
                      {section.items.map((item) => {
                        const href = `/${churchId}${item.href}`
                        const isActive = pathname === href
                        const Icon = item.icon

                        return (
                          <Link
                            key={item.href}
                            href={href}
                            onClick={() => {
                              // Close sidebar on mobile when navigating
                              if (window.innerWidth < 1024) {
                                onToggle()
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-4 py-4 text-xs text-muted-foreground bg-muted/30">
          <p className="font-semibold text-foreground">Church Management System</p>
          <p className="mt-1">v0.0.1</p>
          <p className="mt-2">© 2024 Mito Ya Baraka Church</p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden cursor-pointer"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onKeyDown={(e) => e.key === "Escape" && onToggle()}
        />
      )}
    </>
  )
}
