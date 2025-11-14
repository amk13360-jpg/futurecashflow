"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Settings, DollarSign, Mail, Shield, Database } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getSystemSettings, updateSystemSetting } from "@/lib/actions/settings"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getSystemSettings()
      setSettings(data)
    } catch (error) {
      console.error("[v0] Error loading settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: any) => {
    setSaving(true)
    try {
      await updateSystemSetting(key, value)
      setSettings({ ...settings, [key]: value })
      toast.success("Setting updated successfully")
    } catch (error: any) {
      console.error("[v0] Error saving setting:", error)
      toast.error(error.message || "Failed to save setting")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-muted-foreground">Loading settings...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
          <h2 className="text-3xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Configure platform parameters and system-wide settings</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="finance">
              <DollarSign className="h-4 w-4 mr-2" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Mail className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Platform-wide configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input
                    id="platform-name"
                    defaultValue={settings.platform_name || "FMF Supply Chain Finance"}
                    onBlur={(e) => handleSave("platform_name", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Display name for the platform</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    defaultValue={settings.support_email || "support@fmfscf.com"}
                    onBlur={(e) => handleSave("support_email", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Email address for customer support</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    defaultValue={settings.support_phone || "+27 11 123 4567"}
                    onBlur={(e) => handleSave("support_phone", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Phone number for customer support</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">Temporarily disable platform access</p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode === "true"}
                    onCheckedChange={(checked) => handleSave("maintenance_mode", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Settings */}
          <TabsContent value="finance">
            <Card>
              <CardHeader>
                <CardTitle>Finance Settings</CardTitle>
                <CardDescription>Configure financial parameters and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default-currency">Default Currency</Label>
                  <Input
                    id="default-currency"
                    defaultValue={settings.default_currency || "ZAR"}
                    onBlur={(e) => handleSave("default_currency", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Default currency code (e.g., ZAR, USD)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-discount-rate">Minimum Discount Rate (%)</Label>
                  <Input
                    id="min-discount-rate"
                    type="number"
                    step="0.01"
                    defaultValue={settings.min_discount_rate || "5.00"}
                    onBlur={(e) => handleSave("min_discount_rate", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Minimum annual discount rate for offers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-discount-rate">Maximum Discount Rate (%)</Label>
                  <Input
                    id="max-discount-rate"
                    type="number"
                    step="0.01"
                    defaultValue={settings.max_discount_rate || "15.00"}
                    onBlur={(e) => handleSave("max_discount_rate", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum annual discount rate for offers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offer-expiry-days">Offer Expiry (Days)</Label>
                  <Input
                    id="offer-expiry-days"
                    type="number"
                    defaultValue={settings.offer_expiry_days || "7"}
                    onBlur={(e) => handleSave("offer_expiry_days", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Number of days before an offer expires</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-invoice-amount">Minimum Invoice Amount</Label>
                  <Input
                    id="min-invoice-amount"
                    type="number"
                    step="0.01"
                    defaultValue={settings.min_invoice_amount || "1000.00"}
                    onBlur={(e) => handleSave("min_invoice_amount", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Minimum invoice amount for financing</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-invoice-amount">Maximum Invoice Amount</Label>
                  <Input
                    id="max-invoice-amount"
                    type="number"
                    step="0.01"
                    defaultValue={settings.max_invoice_amount || "10000000.00"}
                    onBlur={(e) => handleSave("max_invoice_amount", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum invoice amount for financing</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email and SMS notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send email notifications to users</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications_enabled !== "false"}
                    onCheckedChange={(checked) => handleSave("email_notifications_enabled", checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send SMS notifications to users</p>
                  </div>
                  <Switch
                    checked={settings.sms_notifications_enabled === "true"}
                    onCheckedChange={(checked) => handleSave("sms_notifications_enabled", checked.toString())}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    defaultValue={settings.smtp_host || ""}
                    onBlur={(e) => handleSave("smtp_host", e.target.value)}
                    placeholder="smtp.example.com"
                  />
                  <p className="text-xs text-muted-foreground">SMTP server hostname</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    defaultValue={settings.smtp_port || "587"}
                    onBlur={(e) => handleSave("smtp_port", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">SMTP server port</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email Address</Label>
                  <Input
                    id="from-email"
                    type="email"
                    defaultValue={settings.from_email || "noreply@fmfscf.com"}
                    onBlur={(e) => handleSave("from_email", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Email address for outgoing notifications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure authentication and security parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (Minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    defaultValue={settings.session_timeout_minutes || "30"}
                    onBlur={(e) => handleSave("session_timeout_minutes", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Automatic logout after inactivity</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    defaultValue={settings.max_login_attempts || "5"}
                    onBlur={(e) => handleSave("max_login_attempts", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Lock account after failed attempts</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Minimum Password Length</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    defaultValue={settings.password_min_length || "8"}
                    onBlur={(e) => handleSave("password_min_length", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Minimum characters for passwords</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Strong Passwords</Label>
                    <p className="text-xs text-muted-foreground">Enforce uppercase, lowercase, numbers, and symbols</p>
                  </div>
                  <Switch
                    checked={settings.require_strong_passwords !== "false"}
                    onCheckedChange={(checked) => handleSave("require_strong_passwords", checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-xs text-muted-foreground">Require 2FA for admin users</p>
                  </div>
                  <Switch
                    checked={settings.require_2fa === "true"}
                    onCheckedChange={(checked) => handleSave("require_2fa", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Database initialization and maintenance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Database Status</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The database schema must be initialized before using the platform. Run the SQL scripts in the
                    scripts folder in order.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>01-create-database-schema.sql - Creates all tables</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>02-seed-initial-data.sql - Adds sample data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>03-update-schema-for-ap-data.sql - Adds vendor fields</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                  <h4 className="font-medium mb-2 text-amber-900 dark:text-amber-100">Important Note</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    If you're seeing 500 errors on the Reports page, it means the database tables haven't been created
                    yet. Please run the SQL scripts using your MySQL client or database management tool.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Input
                    id="backup-frequency"
                    defaultValue={settings.backup_frequency || "daily"}
                    onBlur={(e) => handleSave("backup_frequency", e.target.value)}
                    placeholder="daily, weekly, monthly"
                  />
                  <p className="text-xs text-muted-foreground">How often to backup the database</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Query Logging</Label>
                    <p className="text-xs text-muted-foreground">Log all database queries for debugging</p>
                  </div>
                  <Switch
                    checked={settings.enable_query_logging === "true"}
                    onCheckedChange={(checked) => handleSave("enable_query_logging", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
