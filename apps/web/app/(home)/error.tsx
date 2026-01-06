'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { getUserFriendlyMessage } from '@/lib/error-handler'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Home page error:', error)
  }, [error])

  const message = getUserFriendlyMessage(error)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="rounded-lg bg-white p-8 shadow-md max-w-lg w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-lg bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>

        <p className="mb-4 text-gray-600">
          {message}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-md bg-gray-100 p-3 text-left">
            <p className="text-xs font-mono text-gray-700 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-600">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => reset()}
            className="flex-1"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/setup'}
            variant="outline"
            className="flex-1"
          >
            Go to setup
          </Button>
        </div>
      </div>
    </div>
  )
}
