"use client"

import Link from "next/link"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChurchNotFoundErrorProps {
  churchId?: string
  onRetry?: () => void
}

export function ChurchNotFoundError({ churchId, onRetry }: ChurchNotFoundErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <CardTitle>Church Not Found</CardTitle>
              <CardDescription>Unable to load the requested church</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We couldn't find the church you're looking for. This might happen if:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>The church ID is invalid or has changed</li>
              <li>The church has been deleted</li>
              <li>You don't have access to this church</li>
              <li>The backend service is temporarily unavailable</li>
            </ul>
          </div>

          {/* Church ID Display */}
          {churchId && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs text-muted-foreground font-mono break-all">
                ID: {churchId}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="w-full">
              <Button className="w-full" variant="default">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>

            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>

          {/* Support Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Need help?</strong> Contact support if this problem persists.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
