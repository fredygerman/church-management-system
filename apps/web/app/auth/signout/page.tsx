"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { apiPost } from "@/lib/api-helpers"
import { useT } from "@/components/i18n/locale-provider"

export default function SignOutPage() {
  const { t } = useT()
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
      toast.info(t("final.signout.done"))
    } catch (error) {
      toast.error(t("final.signout.failed"))
    }
  }

  useEffect(() => {
    // Automatically sign out when the page loads
    handleLogout("/auth/signin")
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="mb-4 text-2xl font-bold">{t("final.signout.heading")}</h1>
      <Button
        onClick={async () => {
          await handleLogout("/auth/signin")
        }}
      >
        {t("final.signout.retry")}
      </Button>
    </div>
  )
}
