"use client"

import * as React from "react"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { useSession } from "next-auth/react"

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
import { useT } from "@/components/i18n/locale-provider"

export default function HomeHeader() {
  const { t } = useT()
  const { data: session, status } = useSession()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  if (status === "loading") return <div>{t("common.loading")}</div>
  if (status === "unauthenticated") return null

  const user = session?.user

  if (!user) return <div>{t("final.home.error")}</div>

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/40 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-4">
        <div className="text-sm font-semibold">{t("sidebar.footer.appName")}</div>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-8 rounded-full">
              <Avatar className="size-8">
                <AvatarImage
                  src={
                    user.image || "https://i.ibb.co/R0rhgvP/shadcn-avatar.jpg"
                  }
                  alt={user.name || t("final.common.user")}
                />
                <AvatarFallback>{user.name?.charAt(0) || "C"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDialogOpen(true)}
              className="cursor-pointer bg-destructive text-destructive-foreground"
            >
              <LogOut className="mr-2 size-4" />
              <span>{t("nav.logout.menu")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("nav.logout.title")}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Link
              href="/auth/signout"
              passHref
              //   className="cursor-pointer bg-destructive text-destructive-foreground"
            >
              <Button
                variant="destructive"
                className="cursor-pointer bg-destructive text-destructive-foreground"
              >
                {t("nav.logout.yes")}
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
