"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("[Admin Error]", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong!</CardTitle>
          <CardDescription>
            An error occurred in the admin section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.digest && (
            <div className="text-xs text-muted-foreground text-center font-mono bg-muted p-3 rounded">
              <p className="mb-1 font-semibold">Error Reference:</p>
              <p>{error.digest}</p>
            </div>
          )}
          
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded overflow-auto max-h-48">
              <p className="mb-1 font-semibold">Error Details:</p>
              <pre className="whitespace-pre-wrap">{error.message}</pre>
              {error.stack && (
                <pre className="mt-2 text-[10px] whitespace-pre-wrap opacity-70">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Try clearing your browser cache (Ctrl+Shift+R) and refreshing the page.
          </p>
          
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={reset} variant="default" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
