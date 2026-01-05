"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { sidebarConfig } from "@/config/sidebar"
import { cn } from "@/lib/utils"
import { useHover } from "@/hooks/use-hover"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChurchSwitcher } from "@/components/layout/church-switcher"

interface Church {
  id: string
  name: string
  location?: string
  imageUrl?: string
}

interface DashboardSidebarProps {
  churches: Church[]
  currentChurch: Church | null
}

export function DashboardSidebar({
  churches,
  currentChurch,
}: DashboardSidebarProps) {
  const { churchId } = useParams()
  const { isMobile, open, setOpen } = useSidebar()
  const pathname = usePathname()
  const hoverRef = React.useRef<HTMLDivElement>(null)
  const isHover = useHover(hoverRef as React.RefObject<HTMLDivElement>)

  React.useEffect(() => {
    if (isHover && !isMobile) {
      setOpen(true)
    } else if (!isHover && !isMobile && open) {
      // TODO avoid closing sidebar when dropdowns like church switcher are open
      // setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHover, isMobile, open])

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" ref={hoverRef}>
      <SidebarHeader>
        {churches && (
          <ChurchSwitcher
            churches={churches}
            currentChurch={currentChurch}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        {sidebarConfig.map((section) => (
          <Collapsible
            key={section.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-xs font-bold text-muted-foreground">
                  {section.title}
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = pathname === `/${churchId}${item.href}`
                    const Icon = item.icon

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <Link
                            href={`/${churchId}${item.href}`}
                            target={item.target || "_self"}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted",
                              isActive
                                ? "bg-primary/10 font-medium text-primary hover:bg-primary/15"
                                : "text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {open && (
          <>
            <Card
              className={`${open ? "" : "hidden"} w-auto bg-background shadow-sm transition-all`}
            >
              <CardContent className="justify-center space-y-2 p-3 text-center">
                <h2 className="text-base font-semibold text-muted-foreground">
                  Church Management System
                </h2>
                <div className="text-xs text-muted-foreground">
                  Version 0.0.1
                </div>
                <div className="text-xs text-muted-foreground">
                  © 2024 Mito Ya Baraka Church
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
