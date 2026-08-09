"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle, MapPin, Users } from "lucide-react"
import { signIn } from "next-auth/react"

import { switchChurch } from "@/actions/church"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ChurchCardProps {
  church: {
    id: string
    name: string
    location?: string
    imageUrl?: string
    membershipRole?: string
    membershipStatus?: string
  }
  totalMembers: number
  className?: string
}

export function ChurchCard({
  church,
  totalMembers,
  className,
}: ChurchCardProps) {
  const router = useRouter()
  const [isOpening, setIsOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSuspended = church.membershipStatus === "suspended"

  const openChurch = async () => {
    if (isOpening || isSuspended) {
      return
    }

    setIsOpening(true)
    setError(null)

    try {
      const tokens = await switchChurch(church.id)
      const result = await signIn("credentials", {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Could not update your session")
      }

      const isStaff = church.membershipRole && church.membershipRole !== "member"
      router.push(`/${church.id}/${isStaff ? "dashboard" : "portal"}`)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not open church")
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardHeader className="relative h-48">
          <Image
            src={
              church.imageUrl ||
              "https://images.unsplash.com/photo-1519491050282-cf00c82424b4"
            }
            alt={church.name}
            className="absolute inset-0 size-full object-cover"
            width={250}
            height={150}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-4 bottom-4">
            <CardTitle className="text-2xl font-bold text-white">
              {church.name}
            </CardTitle>
            <CardDescription className="flex items-center text-white/80">
              <MapPin className="mr-1 size-4" />
              {church.location}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {totalMembers.toLocaleString()} members
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
              <CheckCircle className="size-4" />
              <span>{church.membershipStatus || "Active"}</span>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex justify-between p-4">
          <div className="text-sm text-muted-foreground">
            {church.membershipRole?.replace("_", " ") || "member"}
          </div>
          <Button onClick={openChurch} disabled={isOpening || isSuspended}>
            {isOpening ? "Opening" : "Open"}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
