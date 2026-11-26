"use client"

import { FormEvent, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n/locale-provider"
import { postSignInPath } from "@/lib/shell/navigation"

export default function SignInPage() {
  const { t } = useT()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (callbackUrl) {
      toast.error(t("final.signin.needSignIn", { url: callbackUrl }))
    }
  }, [callbackUrl, t])

  const handleGoogleSignIn = () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiBase) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured")
      }

      // Create callback URL with callbackUrl param if present
      const callback = new URL(`${apiBase}/auth/google`)
      if (callbackUrl) {
        callback.searchParams.set("callbackUrl", callbackUrl)
      }
      
      // Redirect to backend Google OAuth endpoint
      // The backend will handle the redirect to Google's OAuth consent screen
      window.location.href = callback.toString()
    } catch (error) {
      console.error("Sign-in error:", error)
      toast.error(t("final.signin.googleFailed"))
    }
  }

  const handleCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!apiBase) return toast.error(t("final.signin.notConfigured"))

    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiBase}/auth/${isRegistering ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      })
      const body = await response.json()
      const result = body.data ?? body
      if (!response.ok || !result.accessToken) throw new Error(body.message || t("final.signin.failed"))

      const signedIn = await signIn("credentials", {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        redirect: false,
      })
      if (!signedIn?.ok) throw new Error(t("final.signin.sessionFailed"))
      window.location.assign(
        postSignInPath({
          callbackUrl,
          churchId: result.user?.activeChurchId || result.user?.churchId,
          role: result.user?.role,
        }),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("final.signin.failed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="rounded-lg bg-card p-8 shadow-md">
        {callbackUrl && (
          <p className="mb-4 text-center text-destructive">
            {t("final.signin.needSignInInline", { url: callbackUrl })}
          </p>
        )}
        <div className="mb-6 flex justify-center">
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        </div>
        <form onSubmit={handleCredentials} className="space-y-3">
          {isRegistering && <input className="w-full rounded border p-2" name="name" placeholder={t("final.signin.fullName")} aria-label={t("final.signin.fullName")} required />}
          <input className="w-full rounded border p-2" name="email" type="email" placeholder={t("final.signin.email")} aria-label={t("final.signin.email")} required />
          <input className="w-full rounded border p-2" name="password" type="password" minLength={12} placeholder={t("final.signin.password")} aria-label={t("final.signin.password")} required />
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("final.signin.pleaseWait") : isRegistering ? t("final.signin.createAccount") : t("final.signin.withEmail")}
          </Button>
        </form>
        <button className="mt-3 w-full text-sm underline" onClick={() => setIsRegistering((value) => !value)} type="button">
          {isRegistering ? t("final.signin.haveAccount") : t("final.signin.needAccount")}
        </button>
        <div className="my-4 border-t" />
        <Button
          onClick={handleGoogleSignIn}
          className="w-full"
        >
          {t("final.signin.withGoogle")}
        </Button>
      </div>
    </div>
  )
}
