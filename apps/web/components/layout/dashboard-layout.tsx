"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Home, LogOut, Menu, User } from "lucide-react"
import { useSession } from "next-auth/react"
import { CustomSidebar } from "./custom-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/layout/mode-toggle"
import Link from "next/link"
import { sidebarConfig } from "@/config/sidebar"
import { generateCombinedTitle, isUUID } from "@/lib/utils"

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const pageTitle = useState(() => {
    for (const section of sidebarConfig) {
      const item = section.items.find((item) => item.href === pathname)
      if (item) {
        return item.title
      }
    }
    const pathParts = pathname.split("/")
    const lastPart = pathParts.pop()
    if (lastPart && isUUID(lastPart)) {
      const dashboardIndex = pathParts.indexOf("dashboard")
      if (dashboardIndex !== -1 && dashboardIndex + 1 < pathParts.length) {
        return pathParts.slice(dashboardIndex + 1).join(" - ")
      }
    }
    return lastPart
  })[0]

  const combinedTitle = generateCombinedTitle(pathname, pageTitle || "")
  const user = session?.user

  return (
    <div className="flex h-screen w-screen bg-background">
      {/* Sidebar - Always visible on desktop, togglable on mobile */}
      <CustomSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
        churches={churches}
        currentChurch={currentChurch}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4">
          <div className="flex items-center gap-4">
            {/* Toggle button - only visible on mobile */}
            <button
              onClick={() => {
                setSidebarOpen(prev => !prev)
              }}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold text-foreground">{combinedTitle}</div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-muted px-2 py-0.5">
            <Link href="/" passHref>
              <Button variant="ghost" size="icon">
                <Home className="size-5 text-foreground" />
              </Button>
            </Link>

            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-8 rounded-full">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={
                        user?.image || "https://i.ibb.co/R0rhgvP/shadcn-avatar.jpg"
                      }
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={`/${pathname.split('/')[1]}/dashboard/profile`} passHref>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDialogOpen(true)}
                  className="cursor-pointer bg-destructive text-destructive-foreground"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Logout Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to log out?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Link href="/auth/signout" passHref>
              <Button
                variant="destructive"
                className="cursor-pointer bg-destructive text-destructive-foreground"
              >
                Yes
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
