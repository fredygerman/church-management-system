"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { apiPost } from "@/lib/api-helpers"

export default function SignOutPage() {
  const handleLogout = async (callbackUrl: string) => {
    try {
      // Revoke the user's tokens on the API while the session still exists.
      // A failure here must not block sign-out.
      // Cap the wait so a stalled API cannot hold up sign-out.
      await Promise.race([
        apiPost("/auth/logout").catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ])
      await signOut({ callbackUrl })
      toast.info("You have been signed out")
    } catch (error) {
      toast.error("An error occurred during logout")
    }
  }

  useEffect(() => {
    // Automatically sign out when the page loads
    handleLogout("/auth/signin")
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="mb-4 text-2xl font-bold">Signing out...</h1>
      <Button
        onClick={async () => {
          await handleLogout("/auth/signin")
        }}
      >
        Click here if you&apos;re not redirected
      </Button>
    </div>
  )
}
