"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const LogoIcon = ({ className = "w-10 h-10 text-primary" }) => (
  <div className="relative">
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 80 80">
      <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
      <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
    </svg>
  </div>
)

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
        <div className="absolute -top-40 -right-40 h-72 w-72 rounded-full bg-green-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-72 w-72 rounded-full bg-green-600/10 blur-3xl"></div>
      </div>
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
        <Card className="bg-card border-0 shadow-none text-foreground">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4 gap-3">
              <LogoIcon className="w-10 h-10 text-blue-600" />
              <span className="font-bold text-blue-600">Future</span>
              <div className="w-px h-8 bg-blue-600/70" />
              <span className="font-bold whitespace-nowrap text-blue-600">Finance Cashflow</span>
            </div>
            <div className="mb-6">
              <div className="p-4 rounded-full border border-border bg-muted inline-block">
                <Users className="h-12 w-12 text-blue-600" />
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
                  className={`form-input transition-colors ${token ? "bg-muted" : ""}`}
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:bg-blue-300 disabled:text-white/70" disabled={loading}>
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