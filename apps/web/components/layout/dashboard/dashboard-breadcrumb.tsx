"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import { sidebarConfig } from "@/config/sidebar"
import { isUUID } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const pathParts = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Build breadcrumbs from path
  let currentPath = ""
  for (const part of pathParts) {
    currentPath += `/${part}`

    // Skip UUIDs in breadcrumb display
    if (isUUID(part)) {
      continue
    }

    // Skip the dashboard part - it will be added as home
    if (part === "dashboard") {
      continue
    }

    // Try to find the label from sidebar config
    let label = part.charAt(0).toUpperCase() + part.slice(1)
    for (const section of sidebarConfig) {
      const item = section.items.find((item) => item.href.endsWith(part))
      if (item) {
        label = item.title
        break
      }
    }

    breadcrumbs.push({
      label,
      href: currentPath,
    })
  }

  // Always add home at the beginning
  const allBreadcrumbs = [
    { label: "Dashboard", href: `/${pathParts[0]}/dashboard` },
    ...breadcrumbs,
  ]

  return (
    <nav className="flex items-center gap-2 text-sm">
      {allBreadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {index === allBreadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href || "#"}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
