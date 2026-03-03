"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFAUserId, setTwoFAUserId] = useState<number | null>(null)
  const [twoFACode, setTwoFACode] = useState("")
  const [isBackupCode, setIsBackupCode] = useState(false)
  const twoFAInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Login failed")
        setLoading(false)
        return
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        setRequires2FA(true)
        setTwoFAUserId(data.userId)
        setLoading(false)
        // Focus the 2FA input after render
        setTimeout(() => twoFAInputRef.current?.focus(), 100)
        return
      }

      router.push("/admin/dashboard")
    } catch (err) {
      toast.error("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: twoFAUserId,
          token: twoFACode,
          isBackupCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Verification failed")
        setTwoFACode("")
        setLoading(false)
        return
      }

      if (data.warning) {
        toast.warning(data.warning)
      }

      router.push("/admin/dashboard")
    } catch (err) {
      toast.error("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleBack = () => {
    setRequires2FA(false)
    setTwoFAUserId(null)
    setTwoFACode("")
    setIsBackupCode(false)
    setPassword("")
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
              {requires2FA ? (
                <ShieldCheck className="w-12 h-12 text-primary" />
              ) : (
                <Logo size="lg" variant="blue" />
              )}
            </div>
            <CardTitle className="font-bold text-2xl">
              {requires2FA ? "Two-Factor Authentication" : "Admin Login"}
            </CardTitle>
            <CardDescription>
              {requires2FA
                ? "Enter the verification code from your authenticator app"
                : "Sign in to access the admin dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requires2FA ? (
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twofa-code" className="font-semibold text-sm">
                    {isBackupCode ? "Backup Code" : "Verification Code"}
                  </Label>
                  <Input
                    ref={twoFAInputRef}
                    id="twofa-code"
                    type="text"
                    inputMode={isBackupCode ? "text" : "numeric"}
                    pattern={isBackupCode ? undefined : "[0-9]*"}
                    maxLength={isBackupCode ? 20 : 6}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value)}
                    placeholder={isBackupCode ? "Enter backup code" : "Enter 6-digit code"}
                    required
                    disabled={loading}
                    autoComplete="one-time-code"
                    className="text-center tracking-widest focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                  />
                </div>
                <Button type="submit" className="py-3 rounded-xl w-full font-semibold" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBackupCode(!isBackupCode)
                      setTwoFACode("")
                    }}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {isBackupCode ? "Use authenticator" : "Use backup code"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="font-semibold text-sm">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                    autoComplete="username"
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
                      autoComplete="current-password"
                      className="pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="top-1/2 right-3 absolute text-muted-foreground hover:text-foreground -translate-y-1/2"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="py-3 rounded-xl w-full font-semibold" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
