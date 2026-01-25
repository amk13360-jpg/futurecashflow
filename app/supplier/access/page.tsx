"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

export default function SupplierAccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const urlToken = searchParams.get("token")
    if (urlToken) {
      setToken(urlToken)
      verifyToken(urlToken)
    }
  }, [searchParams])

  const verifyToken = async (tokenToVerify: string) => {
    setError("")
    setLoading(true)
    try {
      const response = await fetch("/api/auth/supplier/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Token verification failed")
        setLoading(false)
        return
      }
      router.push("/supplier/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyToken(token)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      {/* Modern background gradient and blur effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-72 w-72 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
      </div>
      <div className="w-full max-w-md">
        {/* No back link - suppliers should not see AP login page */}
        <Card className="bg-card border-0 shadow-none text-foreground">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Logo size="lg" />
            </div>
            <div className="mb-6">
              <div className="p-4 rounded-full border border-border bg-muted inline-block">
                <Users className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Supplier Access</CardTitle>
            <CardDescription>Enter your access token to proceed</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-error bg-error/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm font-semibold">Access Token</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your supplier access token"
                  required
                  disabled={loading}
                  autoComplete="off"
                  className="transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
              <Button type="submit" className="w-full font-semibold py-3 rounded-xl" disabled={loading}>
                {loading ? "Verifying..." : "Verify Token"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Supplier access is by invitation only.</p>
              <p className="font-mono text-xs mt-1">Paste the token you received via email.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}