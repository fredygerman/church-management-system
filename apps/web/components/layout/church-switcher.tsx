"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, HomeIcon, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"

import { switchChurch } from "@/actions/church"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n/locale-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Church {
  id: string
  name: string
  location?: string
  imageUrl?: string
  membershipRole?: string
  membershipStatus?: string
}

export function ChurchSwitcher({
  churches,
  currentChurch,
}: {
  churches: Church[]
  currentChurch: Church | null
}) {
  const { t } = useT()
  const router = useRouter()
  const [switchingChurchId, setSwitchingChurchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingChurch, setPendingChurch] = useState<Church | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const goToChurch = async (church: Church) => {
    if (switchingChurchId) {
      return
    }

    setError(null)
    setSwitchingChurchId(church.id)

    try {
      const tokens = await switchChurch(church.id)
      const result = await signIn("credentials", {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(t("staff.church.sessionError"))
      }

      const isStaff = church.membershipRole && church.membershipRole !== "member"
      router.push(`/${church.id}/${isStaff ? "dashboard" : "portal"}`)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("staff.church.error"))
    } finally {
      setSwitchingChurchId(null)
    }
  }

  if (!Array.isArray(churches)) {
    return null
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 rounded-lg border border-border bg-muted hover:bg-muted/80 px-3 py-3 transition-colors text-left">
          <Avatar className="size-8 rounded-lg flex-shrink-0">
            <AvatarImage
              src={currentChurch?.imageUrl || ""}
              alt={currentChurch?.name}
            />
            <AvatarFallback className="rounded-lg text-xs">
              {currentChurch?.name?.slice(0, 2).toUpperCase() || "CH"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {currentChurch?.name || t("staff.church.select")}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentChurch?.location || t("staff.church.fallback")}
            </p>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="start"
      >
        <DropdownMenuLabel>{t("staff.church.context")}</DropdownMenuLabel>
        {churches.map((church) => (
          <DropdownMenuItem
            key={church.id}
            onClick={() => {
              if (currentChurch?.id === church.id) {
                return
              }
              setPendingChurch(church)
              setConfirmOpen(true)
            }}
            className={cn(
              "my-1 flex items-center gap-3 p-2 cursor-pointer rounded-lg",
              currentChurch?.id === church.id && "bg-primary text-primary-foreground"
            )}
            disabled={church.membershipStatus === "suspended" || Boolean(switchingChurchId)}
          >
            <Avatar className="size-8 rounded-sm border border-border">
              <AvatarImage
                src={church.imageUrl || ""}
                alt={church.name}
              />
              <AvatarFallback className="rounded-sm text-xs">
                {church.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {church.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {church.membershipRole?.replace("_", " ") || church.location || t("staff.church.fallback")}
              </p>
            </div>
            {switchingChurchId === church.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : currentChurch?.id === church.id ? (
              <Check className="size-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
        {error ? (
          <p className="px-2 py-1 text-xs text-destructive">{error}</p>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="my-1 flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted">
          <div className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
            <HomeIcon className="size-4" />
          </div>
          <Link href="/" className="flex-1 text-sm">
            {t("staff.church.allChurches")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("staff.church.switchTitle", { name: pendingChurch?.name ?? "" })}</DialogTitle>
          <DialogDescription>
            {t("staff.church.switchDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              setConfirmOpen(false)
              if (pendingChurch) {
                goToChurch(pendingChurch)
              }
            }}
          >
            {t("staff.church.switch")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
