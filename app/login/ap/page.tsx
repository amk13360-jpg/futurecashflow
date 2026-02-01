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
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

export default function APLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [mineCode, setMineCode] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

      // Check if user needs to change password (first login)
      if (data.mustChangePassword) {
        router.push("/login/ap/change-password")
      } else {
        router.push("/ap/dashboard")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex justify-center items-center bg-background px-4 min-h-screen text-foreground">
      {/* Theme toggle top-right */}
      <div className="top-4 right-4 z-10 absolute">
        <ThemeToggle />
      </div>
      {/* Modern background gradient and blur effects */}
      <div className="-z-10 absolute inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-primary/20 blur-3xl rounded-full w-72 h-72"></div>
        <div className="-bottom-40 -left-40 absolute bg-primary/10 blur-3xl rounded-full w-72 h-72"></div>
      </div>
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground text-sm">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to home
        </Link>
        <Card className="bg-card shadow-none border-0 text-foreground">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo size="lg" variant="blue" />
            </div>
            <CardTitle className="font-bold text-2xl">Accounts Payable Login</CardTitle>
            <CardDescription>
              {step === "credentials" ? "Enter your mine code and password" : "Enter the OTP sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-error/10 border-error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="mineCode" className="font-semibold text-sm">Mine Code</Label>
                  <Input
                    id="mineCode"
                    type="text"
                    value={mineCode}
                    onChange={(e) => setMineCode(e.target.value)}
                    placeholder="e.g., AAP001"
                    required
                    disabled={loading}
                    className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      className="pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="top-1/2 right-3 absolute -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="py-3 rounded-xl w-full font-semibold" disabled={loading}>
                  {loading ? "Sending OTP..." : "Continue"}
                </Button>
                
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-error/10 border-error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Alert>
                  <AlertDescription>A 6-digit code has been sent to {email}</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="font-semibold text-sm">One-Time Password</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    disabled={loading}
                    className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                  />
                </div>
                <Button type="submit" className="py-3 rounded-xl w-full font-semibold" disabled={loading}>
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
