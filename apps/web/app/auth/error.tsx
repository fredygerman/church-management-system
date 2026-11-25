'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RotateCcw } from 'lucide-react'
import { getUserFriendlyMessage, getErrorType } from '@/lib/error-handler'
import { useT } from '@/components/i18n/locale-provider'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useT()
  const router = useRouter()
  const errorType = getErrorType(error)
  const message = getUserFriendlyMessage(error, t)

  useEffect(() => {
    console.error('Auth error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="rounded-lg bg-white p-8 shadow-md max-w-lg w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-lg bg-amber-100 p-3">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {errorType === 'auth' ? t('final.error.authTitle') : t('final.error.signInTitle')}
        </h1>

        <p className="mb-4 text-gray-600">
          {message}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 rounded-md bg-gray-100 p-3 text-left">
            <summary className="cursor-pointer text-xs font-semibold text-gray-700">
              {t('final.error.details')}
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
            {t('common.retry')}
          </Button>
          <Button
            onClick={() => router.push('/auth/signin')}
            variant="outline"
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('final.error.backToSignIn')}
          </Button>
        </div>
      </div>
    </div>
  )
}
