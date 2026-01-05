"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, HomeIcon, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Church {
  id: string
  name: string
  location?: string
  imageUrl?: string
}

export function ChurchSwitcher({
  churches,
  currentChurch,
}: {
  churches: Church[]
  currentChurch: Church | null
}) {
  const { isMobile, open } = useSidebar()
  const router = useRouter()

  if (!Array.isArray(churches)) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {open ? "Church" : null}
          </DropdownMenuLabel>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar
                className={`size-8 rounded-lg transition-all ${open ? "size-12" : ""}`}
              >
                <AvatarImage
                  src={currentChurch?.imageUrl || ""}
                  alt={currentChurch?.name}
                />
                <AvatarFallback className="rounded-lg">CH</AvatarFallback>
              </Avatar>
              {open && currentChurch && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentChurch.name}
                  </span>
                  <span className="truncate text-xs">
                    {currentChurch.location || "Church"}
                  </span>
                </div>
              )}
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "right" : "bottom"}
            sideOffset={4}
          >
            {churches.map((church) => (
              <DropdownMenuItem
                key={church.id}
                onClick={() => {
                  router.push(`/${church.id}/dashboard`)
                }}
                className={cn(
                  "my-1 flex items-center gap-2 p-2",
                  currentChurch?.id === church.id && "bg-muted"
                )}
              >
                <Avatar className="size-12 rounded-sm border">
                  <AvatarImage
                    src={church.imageUrl || ""}
                    alt={church.name}
                  />
                  <AvatarFallback className="rounded-sm">
                    {church.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium leading-none">
                    {church.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {church.location || "Church"}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="my-1 flex items-center gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <HomeIcon className="size-4" />
              </div>
              <Link href="/" className="flex-1">
                All Churches
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
