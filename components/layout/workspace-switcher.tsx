"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { workspaces as dbWorkspaces } from "@/db/schema"
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

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
}: {
  workspaces: (typeof dbWorkspaces.$inferSelect)[]
  currentWorkspace: typeof dbWorkspaces.$inferSelect | null
}) {
  console.log("WorkspaceSwitcher workspaces", workspaces)
  console.log("WorkspaceSwitcher currentWorkspace", currentWorkspace)
  const { isMobile, open } = useSidebar()
  const router = useRouter()

  if (!Array.isArray(workspaces)) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {open ? "Workspace" : null}
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
                  src={currentWorkspace?.imageUrl || ""}
                  alt={currentWorkspace?.name}
                />
                <AvatarFallback className="rounded-lg">CF</AvatarFallback>
              </Avatar>
              {open && currentWorkspace && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentWorkspace.name}
                  </span>
                  <span className="truncate text-xs">
                    {/* {currentWorkspace.plan} */} plan
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
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  router.push(`/${workspace.id}/dashboard`)
                }}
                className={cn(
                  "my-1 flex items-center gap-2 p-2", // Added margin
                  currentWorkspace?.id === workspace.id && "bg-muted"
                )}
              >
                <Avatar className="size-12 rounded-sm border">
                  <AvatarImage
                    src={workspace.imageUrl || ""}
                    alt={workspace.name}
                  />
                  <AvatarFallback className="rounded-sm">DN</AvatarFallback>
                </Avatar>
                <span className="truncate">{workspace.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="my-1 flex items-center gap-2 p-2">
              {" "}
              {/* Added margin */}
              <Link
                href={`/${currentWorkspace?.id}/settings`}
                className="flex items-center space-x-1"
              >
                <div className="flex size-5 items-center justify-center rounded-md bg-background">
                  <Settings className="size-4" />
                </div>
                <div className="font-medium text-foreground">Settings</div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="my-1 flex items-center gap-2 p-2">
              {" "}
              {/* Added margin */}
              <Link href="/" className="flex items-center space-x-1">
                <div className="flex size-5 items-center justify-center rounded-md bg-background">
                  <HomeIcon className="size-4" />
                </div>
                <div className="font-medium text-foreground">Home</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
