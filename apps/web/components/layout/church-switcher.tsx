"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, HomeIcon } from "lucide-react"

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
import { Button } from "@/components/ui/button"

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
  const router = useRouter()

  if (!Array.isArray(churches)) {
    return null
  }

  return (
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
              {currentChurch?.name || "Select Church"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentChurch?.location || "Church"}
            </p>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="start"
      >
        {churches.map((church) => (
          <DropdownMenuItem
            key={church.id}
            onClick={() => {
              router.push(`/${church.id}/dashboard`)
            }}
            className={cn(
              "my-1 flex items-center gap-3 p-2 cursor-pointer rounded-lg",
              currentChurch?.id === church.id && "bg-primary text-primary-foreground"
            )}
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
                {church.location || "Church"}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="my-1 flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted">
          <div className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
            <HomeIcon className="size-4" />
          </div>
          <Link href="/" className="flex-1 text-sm">
            All Churches
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
