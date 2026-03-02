"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Eye, EyeOff, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"

export default function SupplierLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/supplier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.")
        setLoading(false)
        return
      }

      router.push("/supplier/dashboard")
    } catch {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex justify-center items-center bg-background px-4 min-h-screen text-foreground">
      {/* Theme toggle */}
      <div className="top-4 right-4 z-10 absolute">
        <div className="bg-muted shadow-sm px-2 py-1 border rounded-full">
          <ThemeToggle className="px-3 rounded-full h-9 text-xs" />
        </div>
      </div>

      {/* Background blurs */}
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
            <CardTitle className="font-bold text-2xl">Supplier Login</CardTitle>
            <CardDescription>Sign in with your email and password</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-error/10 border-error">
                  <AlertCircle className="w-4 h-4 text-error" />
                  <AlertDescription className="text-error text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="top-1/2 right-3 absolute -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="py-3 rounded-xl w-full font-semibold"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-border border-t text-muted-foreground text-sm text-center">
              <p>
                First time accessing the portal?{" "}
                <Link href="/supplier/access" className="font-medium text-primary hover:underline">
                  Use your access link
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
