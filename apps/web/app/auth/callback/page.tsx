"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { getOAuthTokensFromCookies } from "@/actions/auth"
import { useT } from "@/components/i18n/locale-provider"
import { isSafeInternalPath } from "@/lib/shell/navigation"

export default function OAuthCallbackPage() {
  const { t } = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const errorParam = searchParams.get("error")

        // Handle OAuth errors
        if (errorParam) {
          setError(errorParam)
          toast.error(t("final.callback.failed", { reason: errorParam }))
          setIsProcessing(false)

          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
          return
        }

        // Tokens are no longer passed via URL (leaked into browser history/logs) —
        // the backend sets them as HttpOnly cookies and this reads them server-side.
        const tokenResult = await getOAuthTokensFromCookies()

        if (!tokenResult.success || !tokenResult.tokens) {
          setError(t("final.callback.noTokens"))
          toast.error(t("final.callback.failed", { reason: t("final.callback.missingTokens") }))
          setIsProcessing(false)

          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
          return
        }

        const { accessToken, refreshToken } = tokenResult.tokens

        // Sign in with NextAuth using the tokens from the backend
        // This creates a JWT session with the tokens
        const result = await signIn("credentials", {
          accessToken,
          refreshToken,
          redirect: false,
        })

        if (!result?.ok) {
          setError(t("final.callback.sessionFailed"))
          toast.error(t("final.callback.sessionFailed"))
          setIsProcessing(false)
          
          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
          return
        }

        toast.success(t("final.callback.success"))
        
        // Get redirect URL from search params or use default
        // Same-origin paths only (RM-012): reject //host, /\\host, absolute and encoded tricks.
        const requested = searchParams.get("callbackUrl")
        const callbackUrl = isSafeInternalPath(requested) ? requested : "/"
        router.push(callbackUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : t("final.callback.unknownError")
        setError(message)
        toast.error(t("final.callback.error", { message }))
        setIsProcessing(false)
        
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
      }
    }

    processCallback()
  }, [searchParams, router, t])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-md text-center">
        {isProcessing ? (
          <>
            <h1 className="mb-4 text-2xl font-bold">{t("final.callback.heading")}</h1>
            <p className="text-gray-600">{t("final.callback.wait")}</p>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </>
        ) : error ? (
          <>
            <h1 className="mb-4 text-2xl font-bold text-red-600">{t("final.callback.failedHeading")}</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">{t("final.callback.redirecting")}</p>
          </>
        ) : null}
      </div>
    </div>
  )
}
