"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

export default function APLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [mineCode, setMineCode] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login/ap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mineCode, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }

      setUserId(data.userId)
      setEmail(data.email)
      setStep("otp")
      setLoading(false)

      // Show OTP in development
      if (data.otp) {
        alert(`Development Mode - Your OTP is: ${data.otp}`)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "OTP verification failed")
        setLoading(false)
        return
      }

      router.push("/ap/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
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
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
        <Card className="bg-card border-0 shadow-none text-foreground">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl font-bold">Accounts Payable Login</CardTitle>
            <CardDescription>
              {step === "credentials" ? "Enter your mine code and password" : "Enter the OTP sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-error bg-error/10">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="mineCode" className="text-sm font-semibold">Mine Code</Label>
                  <Input
                    id="mineCode"
                    type="text"
                    value={mineCode}
                    onChange={(e) => setMineCode(e.target.value)}
                    placeholder="e.g., AAP001"
                    required
                    disabled={loading}
                    className="transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold py-3 rounded-xl" disabled={loading}>
                  {loading ? "Sending OTP..." : "Continue"}
                </Button>
                
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-error bg-error/10">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Alert>
                  <AlertDescription>A 6-digit code has been sent to {email}</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-semibold">One-Time Password</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    disabled={loading}
                    className="transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold py-3 rounded-xl" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("credentials")}
                  disabled={loading}
                >
                  Back to login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
