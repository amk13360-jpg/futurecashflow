"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormErrorSummary } from "@/components/ui/form-summary"
import { Users } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

export default function SupplierAccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const errorList = error ? [{ field: "token", message: error }] : []

  const handleFormErrorClick = (field: string) => {
    const target = document.getElementById(field)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" })
      ;(target as HTMLElement).focus?.()
    }
  }

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
    <div className="relative flex justify-center items-center bg-background px-4 min-h-screen text-foreground">
      {/* Theme toggle top-right */}
      <div className="top-4 right-4 z-10 absolute">
        <div className="bg-muted shadow-sm px-2 py-1 border rounded-full">
          <ThemeToggle className="px-3 rounded-full h-9 text-xs" />
        </div>
      </div>
      {/* Modern background gradient and blur effects */}
      <div className="-z-10 absolute inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-primary/20 blur-3xl rounded-full w-72 h-72"></div>
        <div className="-bottom-40 -left-40 absolute bg-primary/10 blur-3xl rounded-full w-72 h-72"></div>
      </div>
      <div className="w-full max-w-md">
        {/* No back link - suppliers should not see AP login page */}
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
            <CardTitle className="font-bold text-2xl">Supplier Access</CardTitle>
            <CardDescription>Enter your access token to proceed</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorList.length > 0 && (
                <FormErrorSummary errors={errorList} onFieldClick={handleFormErrorClick} />
              )}
              <div className="space-y-2">
                <Label htmlFor="token" className="font-semibold text-sm">Access Token</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your supplier access token"
                  required
                  disabled={loading}
                  autoComplete="off"
                  className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                />
              </div>
              <Button type="submit" className="py-3 rounded-xl w-full font-semibold" disabled={loading}>
                {loading ? "Verifying..." : "Verify Token"}
              </Button>
            </form>
            <div className="mt-6 text-muted-foreground text-sm text-center">
              <p>Supplier access is by invitation only.</p>
              <p className="mt-1 font-mono text-xs">Paste the token you received via email.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
