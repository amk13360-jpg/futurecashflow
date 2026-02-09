"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormErrorSummary } from "@/components/ui/form-summary"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Mail, ArrowLeft, CheckCircle, Clock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

type ViewMode = "token" | "request-access" | "request-sent"

export default function SupplierAccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("token")
  const [isTokenExpired, setIsTokenExpired] = useState(false)

  const errorList = error ? [{ field: viewMode === "token" ? "token" : "email", message: error }] : []

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
    setIsTokenExpired(false)
    try {
      const response = await fetch("/api/auth/supplier/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify }),
      })
      const data = await response.json()
      if (!response.ok) {
        // Check if token is expired or already used
        if (data.error?.includes("expired") || data.error?.includes("Invalid")) {
          setIsTokenExpired(true)
        }
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

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyToken(token)
  }

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      const response = await fetch("/api/auth/supplier/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Failed to request access")
        setLoading(false)
        return
      }
      
      setViewMode("request-sent")
      setLoading(false)
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
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
        <Card className="bg-card shadow-none border-0 text-foreground">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo size="lg" variant="blue" />
            </div>
            <div className="mb-6">
              <div className="inline-block bg-muted p-4 border border-border rounded-full">
                {viewMode === "request-sent" ? (
                  <CheckCircle className="w-12 h-12 text-success" />
                ) : viewMode === "request-access" ? (
                  <Mail className="w-12 h-12 text-primary" />
                ) : (
                  <Users className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="font-bold text-2xl">
              {viewMode === "request-sent" 
                ? "Check Your Email" 
                : viewMode === "request-access" 
                  ? "Request Access Link" 
                  : "Supplier Access"}
            </CardTitle>
            <CardDescription>
              {viewMode === "request-sent"
                ? "We've sent you a new access link"
                : viewMode === "request-access"
                  ? "Enter your registered email to receive a new access link"
                  : "Enter your access token to proceed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Token Entry View */}
            {viewMode === "token" && (
              <>
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  {errorList.length > 0 && (
                    <FormErrorSummary errors={errorList} onFieldClick={handleFormErrorClick} />
                  )}
                  
                  {/* Show helpful message if token expired */}
                  {isTokenExpired && (
                    <Alert className="bg-warning/10 border-warning">
                      <Clock className="w-4 h-4 text-warning" />
                      <AlertDescription className="text-sm">
                        Your access link has expired or was already used. 
                        Request a new link below.
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
                        setError("")
                        setIsTokenExpired(false)
                      }}
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
                
                <div className="mt-6 pt-6 border-border border-t">
                  <p className="mb-3 text-muted-foreground text-sm text-center">
                    Don't have a valid token or it expired?
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setViewMode("request-access")
                      setError("")
                    }}
                  >
                    <Mail className="mr-2 w-4 h-4" />
                    Request New Access Link
                  </Button>
                </div>
                
                <div className="mt-6 text-muted-foreground text-sm text-center">
                  <p>Supplier access is by invitation only.</p>
                  <p className="mt-1 font-mono text-xs">Paste the token you received via email.</p>
                </div>
              </>
            )}

            {/* Request Access View */}
            {viewMode === "request-access" && (
              <>
                <form onSubmit={handleRequestAccess} className="space-y-4">
                  {errorList.length > 0 && (
                    <FormErrorSummary errors={errorList} onFieldClick={handleFormErrorClick} />
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold text-sm">Registered Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError("")
                      }}
                      placeholder="Enter your registered email address"
                      required
                      disabled={loading}
                      autoComplete="email"
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                    />
                    <p className="text-muted-foreground text-xs">
                      This should be the email address your buyer has registered for you.
                    </p>
                  </div>
                  <Button type="submit" className="py-3 rounded-xl w-full font-semibold" disabled={loading}>
                    {loading ? "Sending..." : "Send Access Link"}
                  </Button>
                </form>
                
                <div className="mt-6 pt-6 border-border border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setViewMode("token")
                      setError("")
                    }}
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to Token Entry
                  </Button>
                </div>
              </>
            )}

            {/* Request Sent Confirmation View */}
            {viewMode === "request-sent" && (
              <div className="space-y-4 text-center">
                <div className="bg-success/10 p-4 border border-success/20 rounded-lg">
                  <p className="text-foreground text-sm">
                    If an account exists with <strong>{email}</strong>, you will receive 
                    a new access link within a few minutes.
                  </p>
                </div>
                
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>Please check your inbox and spam folder.</p>
                  <p>The link will be valid for <strong>14 days</strong>.</p>
                </div>
                
                <div className="space-y-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setViewMode("token")
                      setError("")
                      setEmail("")
                    }}
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to Token Entry
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground text-sm"
                    onClick={() => {
                      setViewMode("request-access")
                      setError("")
                    }}
                  >
                    Didn't receive it? Try again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
