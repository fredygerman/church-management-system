'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RotateCcw } from 'lucide-react'
import { getUserFriendlyMessage, getErrorType } from '@/lib/error-handler'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const errorType = getErrorType(error)
  const message = getUserFriendlyMessage(error)

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  const getErrorIcon = () => {
    switch (errorType) {
      case 'auth':
        return '🔐'
      case 'server':
        return '⚠️'
      case 'network':
        return '📡'
      case 'client':
        return '❌'
      default:
        return '⚠️'
    }
  }

  const getErrorTitle = () => {
    switch (errorType) {
      case 'auth':
        return 'Authentication Error'
      case 'server':
        return 'Server Error'
      case 'network':
        return 'Connection Error'
      case 'client':
        return 'Invalid Request'
      default:
        return 'Something went wrong'
    }
  }

  const getRedirectPath = () => {
    if (errorType === 'auth') {
      return '/auth/signin'
    }
    return '/'
  }

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
          <div className="rounded-lg bg-white p-8 shadow-md max-w-lg w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-lg bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              {getErrorTitle()}
            </h1>

            <p className="mb-4 text-gray-600">
              {message}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 rounded-md bg-gray-100 p-3 text-left">
                <summary className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-900">
                  Error Details
                </summary>
                <p className="mt-3 text-xs font-mono text-gray-700 break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-gray-600">
                    Digest: {error.digest}
                  </p>
                )}
              </details>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => reset()}
                className="flex-1"
                variant="default"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Button
                onClick={() => router.push(getRedirectPath())}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                {errorType === 'auth' ? 'Sign in' : 'Home'}
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
