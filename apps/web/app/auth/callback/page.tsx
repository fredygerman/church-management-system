"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Cookies from "js-cookie"

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const accessToken = searchParams.get("accessToken")
        const refreshToken = searchParams.get("refreshToken")
        const errorParam = searchParams.get("error")

        // Handle OAuth errors
        if (errorParam) {
          setError(errorParam)
          toast.error(`Authentication failed: ${errorParam}`)
          setIsProcessing(false)
          
          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
          return
        }

        if (!accessToken) {
          setError("No access token received")
          toast.error("Authentication failed: No access token received")
          setIsProcessing(false)
          
          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
          return
        }

        // Store tokens in cookies
        Cookies.set("accessToken", accessToken, {
          expires: 30,
          secure: true,
          sameSite: "Lax",
        })

        if (refreshToken) {
          Cookies.set("refreshToken", refreshToken, {
            expires: 30,
            secure: true,
            sameSite: "Lax",
          })
        }

        // Get the return URL from cookie or use default
        const returnUrl = Cookies.get("returnTo") || "/"
        Cookies.remove("returnTo")

        toast.success("Sign-in successful!")
        router.push(returnUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        toast.error(`Sign-in error: ${message}`)
        setIsProcessing(false)
        
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
      }
    }

    processCallback()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-md text-center">
        {isProcessing ? (
          <>
            <h1 className="mb-4 text-2xl font-bold">Completing sign-in...</h1>
            <p className="text-gray-600">Please wait while we complete your authentication.</p>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </>
        ) : error ? (
          <>
            <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Failed</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to sign-in...</p>
          </>
        ) : null}
      </div>
    </div>
  )
}
