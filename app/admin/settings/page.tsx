"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Settings, DollarSign, Mail, Shield, Database, Users, Plus, Edit, Trash2, Key, UserCog } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getSystemSettings, updateSystemSetting } from "@/lib/actions/settings"
import { getUsers, getBuyersForDropdown, createUser, updateUser, resetUserPassword, toggleUserStatus, deleteUser } from "@/lib/actions/users"
import type { User } from "@/lib/actions/users"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({})
  
  // User management state
  const [users, setUsers] = useState<User[]>([])
  const [buyers, setBuyers] = useState<{ buyer_id: number; name: string; code: string }[]>([])
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    role: "ap_user" as "admin" | "ap_user" | "buyer_admin",
    buyer_id: null as number | null,
  })
  const [newPassword, setNewPassword] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  useEffect(() => {
    loadSettings()
    loadUsers()
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

  const loadUsers = async () => {
    try {
      const [usersData, buyersData] = await Promise.all([
        getUsers(),
        getBuyersForDropdown()
      ])
      setUsers(usersData)
      setBuyers(buyersData)
    } catch (error) {
      console.error("[v0] Error loading users:", error)
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

  const handleCreateUser = async () => {
    const result = await createUser(userForm)
    if (result.success) {
      toast.success("User created successfully")
      setShowUserDialog(false)
      resetUserForm()
      loadUsers()
    } else {
      toast.error(result.error || "Failed to create user")
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    const result = await updateUser({
      user_id: editingUser.user_id,
      full_name: userForm.full_name,
      email: userForm.email,
      role: userForm.role,
      buyer_id: userForm.buyer_id,
    })
    if (result.success) {
      toast.success("User updated successfully")
      setShowUserDialog(false)
      setEditingUser(null)
      resetUserForm()
      loadUsers()
    } else {
      toast.error(result.error || "Failed to update user")
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return
    const result = await resetUserPassword(selectedUserId, newPassword)
    if (result.success) {
      toast.success("Password reset successfully")
      setShowPasswordDialog(false)
      setNewPassword("")
      setSelectedUserId(null)
    } else {
      toast.error(result.error || "Failed to reset password")
    }
  }

  const handleToggleStatus = async (userId: number) => {
    const result = await toggleUserStatus(userId)
    if (result.success) {
      toast.success(`User ${result.newStatus === 'active' ? 'activated' : 'deactivated'}`)
      loadUsers()
    } else {
      toast.error(result.error || "Failed to toggle user status")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return
    const result = await deleteUser(userId)
    if (result.success) {
      toast.success("User deactivated")
      loadUsers()
    } else {
      toast.error(result.error || "Failed to delete user")
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      full_name: user.full_name || "",
      email: user.email,
      password: "",
      role: user.role,
      buyer_id: user.buyer_id,
    })
    setShowUserDialog(true)
  }

  const resetUserForm = () => {
    setUserForm({
      username: "",
      full_name: "",
      email: "",
      password: "",
      role: "ap_user",
      buyer_id: null,
    })
  }

  if (loading) {
    return (
      <div className="bg-muted/30 min-h-screen">
        <DashboardHeader />
        <main className="mx-auto px-4 py-8 container">
          <div className="py-12 text-muted-foreground text-center">Loading settings...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <DashboardHeader />

      <main className="mx-auto px-4 py-8 container">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to dashboard
          </Link>
          <h2 className="font-bold text-3xl">System Settings</h2>
          <p className="text-muted-foreground">Configure platform parameters and system-wide settings</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="mr-2 w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="finance">
              <DollarSign className="mr-2 w-4 h-4" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Mail className="mr-2 w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="mr-2 w-4 h-4" />
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
                  <p className="text-muted-foreground text-xs">Display name for the platform</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    defaultValue={settings.support_email || "support@fmfscf.com"}
                    onBlur={(e) => handleSave("support_email", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">Email address for customer support</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    defaultValue={settings.support_phone || "+27 11 123 4567"}
                    onBlur={(e) => handleSave("support_phone", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">Phone number for customer support</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-muted-foreground text-xs">Temporarily disable platform access</p>
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
                  <p className="text-muted-foreground text-xs">Default currency code (e.g., ZAR, USD)</p>
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
                  <p className="text-muted-foreground text-xs">Minimum annual discount rate for offers</p>
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
                  <p className="text-muted-foreground text-xs">Maximum annual discount rate for offers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offer-expiry-days">Offer Expiry (Days)</Label>
                  <Input
                    id="offer-expiry-days"
                    type="number"
                    defaultValue={settings.offer_expiry_days || "7"}
                    onBlur={(e) => handleSave("offer_expiry_days", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">Number of days before an offer expires</p>
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
                  <p className="text-muted-foreground text-xs">Minimum invoice amount for financing</p>
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
                  <p className="text-muted-foreground text-xs">Maximum invoice amount for financing</p>
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
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-muted-foreground text-xs">Send email notifications to users</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications_enabled !== "false"}
                    onCheckedChange={(checked) => handleSave("email_notifications_enabled", checked.toString())}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-muted-foreground text-xs">Send SMS notifications to users</p>
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
                  <p className="text-muted-foreground text-xs">SMTP server hostname</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    defaultValue={settings.smtp_port || "587"}
                    onBlur={(e) => handleSave("smtp_port", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">SMTP server port</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email Address</Label>
                  <Input
                    id="from-email"
                    type="email"
                    defaultValue={settings.from_email || "noreply@fmfscf.com"}
                    onBlur={(e) => handleSave("from_email", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">Email address for outgoing notifications</p>
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
                  <p className="text-muted-foreground text-xs">Automatic logout after inactivity</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    defaultValue={settings.max_login_attempts || "5"}
                    onBlur={(e) => handleSave("max_login_attempts", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">Lock account after failed attempts</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Minimum Password Length</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    defaultValue={settings.password_min_length || "8"}
                    onBlur={(e) => handleSave("password_min_length", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">Minimum characters for passwords</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Require Strong Passwords</Label>
                    <p className="text-muted-foreground text-xs">Enforce uppercase, lowercase, numbers, and symbols</p>
                  </div>
                  <Switch
                    checked={settings.require_strong_passwords !== "false"}
                    onCheckedChange={(checked) => handleSave("require_strong_passwords", checked.toString())}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-muted-foreground text-xs">Require 2FA for admin users</p>
                  </div>
                  <Switch
                    checked={settings.require_2fa === "true"}
                    onCheckedChange={(checked) => handleSave("require_2fa", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage system users and their permissions</CardDescription>
                </div>
                <Dialog open={showUserDialog} onOpenChange={(open) => {
                  setShowUserDialog(open)
                  if (!open) {
                    setEditingUser(null)
                    resetUserForm()
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingUser(null); resetUserForm(); }}>
                      <Plus className="mr-2 w-4 h-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                      <DialogDescription>
                        {editingUser ? "Update user details and permissions" : "Add a new user to the system"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="gap-4 grid py-4">
                      {!editingUser && (
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                            placeholder="johndoe"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      {!editingUser && (
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="••••••••"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value: "admin" | "ap_user" | "buyer_admin") => setUserForm({ ...userForm, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="ap_user">AP User</SelectItem>
                            <SelectItem value="buyer_admin">Buyer Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {userForm.role !== "admin" && (
                        <div className="space-y-2">
                          <Label htmlFor="buyer">Buyer (Company)</Label>
                          <Select
                            value={userForm.buyer_id?.toString() || ""}
                            onValueChange={(value) => setUserForm({ ...userForm, buyer_id: value ? Number(value) : null })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select buyer" />
                            </SelectTrigger>
                            <SelectContent>
                              {buyers.map((buyer) => (
                                <SelectItem key={buyer.buyer_id} value={buyer.buyer_id.toString()}>
                                  {buyer.name} ({buyer.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancel</Button>
                      <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                        {editingUser ? "Update" : "Create"} User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <div className="py-8 text-muted-foreground text-center">
                      <Users className="opacity-50 mx-auto mb-3 w-12 h-12" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3 font-medium text-left">User</th>
                            <th className="p-3 font-medium text-left">Role</th>
                            <th className="p-3 font-medium text-left">Buyer</th>
                            <th className="p-3 font-medium text-left">Status</th>
                            <th className="p-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.user_id} className="border-t">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{user.full_name || user.username}</p>
                                  <p className="text-muted-foreground text-sm">{user.email}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="capitalize">
                                  {user.role.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {user.buyer_name ? (
                                  <span className="text-sm">{user.buyer_name} ({user.buyer_code})</span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge variant={user.status === "active" ? "default" : "secondary"} className="capitalize">
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(user)}
                                    title="Edit user"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserId(user.user_id)
                                      setShowPasswordDialog(true)
                                    }}
                                    title="Reset password"
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleStatus(user.user_id)}
                                    title={user.status === "active" ? "Deactivate" : "Activate"}
                                  >
                                    <UserCog className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    title="Delete user"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Reset Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>Enter a new password for the user</DialogDescription>
                </DialogHeader>
                <div className="gap-4 grid py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
                  <Button onClick={handleResetPassword}>Reset Password</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Database initialization and maintenance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 border rounded-lg">
                  <h4 className="mb-2 font-medium">Database Status</h4>
                  <p className="mb-4 text-muted-foreground text-sm">
                    The database schema must be initialized before using the platform. Run the SQL scripts in the
                    scripts folder in order.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500 rounded-full w-2 h-2" />
                      <span>01-create-database-schema.sql - Creates all tables</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500 rounded-full w-2 h-2" />
                      <span>02-seed-initial-data.sql - Adds sample data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500 rounded-full w-2 h-2" />
                      <span>03-update-schema-for-ap-data.sql - Adds vendor fields</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <h4 className="mb-2 font-medium text-amber-900 dark:text-amber-100">Important Note</h4>
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
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
                  <p className="text-muted-foreground text-xs">How often to backup the database</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Enable Query Logging</Label>
                    <p className="text-muted-foreground text-xs">Log all database queries for debugging</p>
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
