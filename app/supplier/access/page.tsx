"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Clock, LogIn } from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"

export default function SupplierAccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [isTokenExpired, setIsTokenExpired] = useState(false)

  useEffect(() => {
    const urlToken = searchParams.get("token")
    if (urlToken) {
      setToken(urlToken)
      verifyToken(urlToken)
    }
  }, [searchParams])

  const verifyToken = async (tokenToVerify: string) => {
    setLoading(true)
    setIsTokenExpired(false)
    try {
      const response = await fetch("/api/auth/supplier/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.error?.includes("expired") || data.error?.includes("Invalid")) {
          setIsTokenExpired(true)
        }
        toast.error(data.error || "Token verification failed")
        setLoading(false)
        return
      }
      router.push("/supplier/dashboard")
    } catch {
      toast.error("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyToken(token)
  }

  return (
    <div className="relative flex justify-center items-center bg-background px-4 min-h-screen text-foreground">
      {/* Theme toggle top-right */}
      <div className="top-4 right-4 z-10 absolute">
        <div className="bg-muted shadow-sm px-2 py-1 border rounded-full">
          <ThemeToggle className="px-3 rounded-full h-9 text-xs" />
        </div>
      </div>

      {/* Background blur effects */}
      <div className="-z-10 absolute inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-primary/20 blur-3xl rounded-full w-72 h-72" />
        <div className="-bottom-40 -left-40 absolute bg-primary/10 blur-3xl rounded-full w-72 h-72" />
      </div>

      <div className="w-full max-w-md">
        <Card className="bg-card shadow-none border-0 text-foreground">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo size="lg" variant="blue" />
            </div>
            <div className="mb-6">
              <div className="inline-block bg-muted p-4 border border-border rounded-full">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>
            <CardTitle className="font-bold text-2xl">First-Time Portal Access</CardTitle>
            <CardDescription>
              Enter the one-time access token from your welcome email
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              {/* Expired token message */}
              {isTokenExpired && (
                <Alert className="bg-warning/10 border-warning">
                  <Clock className="w-4 h-4 text-warning" />
                  <AlertDescription className="text-sm">
                    Your access link has expired or has already been used.
                    If you have already signed your cession agreement, use your login credentials below.
                    Otherwise, contact <strong>support@futureminingfinance.co.za</strong> for assistance.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="token" className="font-semibold text-sm">Access Token</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value)
                    setIsTokenExpired(false)
                  }}
                  placeholder="Paste your one-time access token"
                  required
                  disabled={loading}
                  autoComplete="off"
                  className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                />
              </div>

              <Button
                type="submit"
                className="py-3 rounded-xl w-full font-semibold"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Token"}
              </Button>
            </form>

            {/* Login with credentials link */}
            <div className="mt-6 pt-6 border-border border-t">
              <p className="mb-3 text-muted-foreground text-sm text-center">
                Already signed your cession agreement?
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/supplier/login">
                  <LogIn className="mr-2 w-4 h-4" />
                  Sign in with your credentials
                </Link>
              </Button>
            </div>

            <div className="mt-4 text-muted-foreground text-xs text-center">
              <p>The access token is for first-time use only.</p>
              <p className="mt-1">After signing your cession agreement, login credentials will be emailed to you once approved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
