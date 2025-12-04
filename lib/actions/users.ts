"use server"

import { query, transaction } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { hashPassword } from "@/lib/auth/password"
import { revalidatePath } from "next/cache"
import type { RowDataPacket } from "mysql2"

// Types
export interface User {
  user_id: number
  username: string
  full_name: string | null
  email: string
  role: "admin" | "ap_user" | "buyer_admin"
  buyer_id: number | null
  buyer_name: string | null
  buyer_code: string | null
  status: "active" | "inactive" | "locked"
  created_at: string
  last_login: string | null
}

export interface CreateUserInput {
  username: string
  full_name: string
  email: string
  password: string
  role: "admin" | "ap_user" | "buyer_admin"
  buyer_id: number | null
}

export interface UpdateUserInput {
  user_id: number
  full_name?: string
  email?: string
  role?: "admin" | "ap_user" | "buyer_admin"
  buyer_id?: number | null
  status?: "active" | "inactive" | "locked"
}

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<User[]> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    const users = await query<RowDataPacket[]>(
      `SELECT u.user_id, u.username, u.full_name, u.email, u.role, u.buyer_id,
              u.status, u.created_at, u.last_login,
              b.name as buyer_name, b.code as buyer_code
       FROM users u
       LEFT JOIN buyers b ON u.buyer_id = b.buyer_id
       ORDER BY u.created_at DESC`
    )

    return users as unknown as User[]
  } catch (error) {
    console.error("[User Management] Error fetching users:", error)
    throw error
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: number): Promise<User | null> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    const users = await query<RowDataPacket[]>(
      `SELECT u.user_id, u.username, u.full_name, u.email, u.role, u.buyer_id,
              u.status, u.created_at, u.last_login,
              b.name as buyer_name, b.code as buyer_code
       FROM users u
       LEFT JOIN buyers b ON u.buyer_id = b.buyer_id
       WHERE u.user_id = ?`,
      [userId]
    )

    return users.length > 0 ? (users[0] as unknown as User) : null
  } catch (error) {
    console.error("[User Management] Error fetching user:", error)
    throw error
  }
}

/**
 * Get all buyers for dropdown
 */
export async function getBuyersForDropdown(): Promise<{ buyer_id: number; name: string; code: string }[]> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    const buyers = await query<RowDataPacket[]>(
      `SELECT buyer_id, name, code FROM buyers ORDER BY name ASC`
    )

    return buyers as unknown as { buyer_id: number; name: string; code: string }[]
  } catch (error) {
    console.error("[User Management] Error fetching buyers:", error)
    throw error
  }
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<{ success: boolean; userId?: number; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Check if username already exists
    const existing = await query<RowDataPacket[]>(
      `SELECT user_id FROM users WHERE username = ? OR email = ?`,
      [input.username, input.email]
    )

    if (existing.length > 0) {
      return { success: false, error: "Username or email already exists" }
    }

    // Validate buyer_id for non-admin roles
    if (input.role !== "admin" && !input.buyer_id) {
      return { success: false, error: "Buyer is required for AP users and Buyer Admins" }
    }

    // Hash password
    const password_hash = await hashPassword(input.password)

    // Create user
    const result = await query<RowDataPacket[]>(
      `INSERT INTO users (username, password_hash, full_name, email, role, buyer_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [input.username, password_hash, input.full_name, input.email, input.role, input.buyer_id]
    )

    const insertResult = result as any
    const userId = insertResult.insertId

    await createAuditLog({
      userType: "admin",
      action: "USER_CREATED",
      entityType: "user",
      entityId: userId,
      details: `Admin ${session.username} created user ${input.username} (${input.role})`,
    })

    revalidatePath("/admin/settings")
    return { success: true, userId }
  } catch (error: any) {
    console.error("[User Management] Error creating user:", error)
    return { success: false, error: error.message || "Failed to create user" }
  }
}

/**
 * Update an existing user
 */
export async function updateUser(input: UpdateUserInput): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (input.full_name !== undefined) {
      updates.push("full_name = ?")
      values.push(input.full_name)
    }
    if (input.email !== undefined) {
      // Check email uniqueness
      const existing = await query<RowDataPacket[]>(
        `SELECT user_id FROM users WHERE email = ? AND user_id != ?`,
        [input.email, input.user_id]
      )
      if (existing.length > 0) {
        return { success: false, error: "Email already in use by another user" }
      }
      updates.push("email = ?")
      values.push(input.email)
    }
    if (input.role !== undefined) {
      updates.push("role = ?")
      values.push(input.role)
    }
    if (input.buyer_id !== undefined) {
      updates.push("buyer_id = ?")
      values.push(input.buyer_id)
    }
    if (input.status !== undefined) {
      updates.push("status = ?")
      values.push(input.status)
    }

    if (updates.length === 0) {
      return { success: false, error: "No fields to update" }
    }

    updates.push("updated_at = NOW()")
    values.push(input.user_id)

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`,
      values
    )

    await createAuditLog({
      userType: "admin",
      action: "USER_UPDATED",
      entityType: "user",
      entityId: input.user_id,
      details: `Admin ${session.username} updated user ${input.user_id}`,
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error: any) {
    console.error("[User Management] Error updating user:", error)
    return { success: false, error: error.message || "Failed to update user" }
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(
  userId: number,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const password_hash = await hashPassword(newPassword)

    await query(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?`,
      [password_hash, userId]
    )

    await createAuditLog({
      userType: "admin",
      action: "PASSWORD_RESET",
      entityType: "user",
      entityId: userId,
      details: `Admin ${session.username} reset password for user ${userId}`,
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error: any) {
    console.error("[User Management] Error resetting password:", error)
    return { success: false, error: error.message || "Failed to reset password" }
  }
}

/**
 * Delete a user (soft delete by setting status to inactive)
 */
export async function deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  // Prevent self-deletion
  if (session.userId === userId) {
    return { success: false, error: "Cannot delete your own account" }
  }

  try {
    await query(
      `UPDATE users SET status = 'inactive', updated_at = NOW() WHERE user_id = ?`,
      [userId]
    )

    await createAuditLog({
      userType: "admin",
      action: "USER_DELETED",
      entityType: "user",
      entityId: userId,
      details: `Admin ${session.username} deleted (deactivated) user ${userId}`,
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error: any) {
    console.error("[User Management] Error deleting user:", error)
    return { success: false, error: error.message || "Failed to delete user" }
  }
}

/**
 * Toggle user active/inactive status
 */
export async function toggleUserStatus(userId: number): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  // Prevent self-deactivation
  if (session.userId === userId) {
    return { success: false, error: "Cannot deactivate your own account" }
  }

  try {
    // Get current status
    const users = await query<RowDataPacket[]>(
      `SELECT status FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return { success: false, error: "User not found" }
    }

    const currentStatus = users[0].status
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    await query(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE user_id = ?`,
      [newStatus, userId]
    )

    await createAuditLog({
      userType: "admin",
      action: newStatus === "active" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entityType: "user",
      entityId: userId,
      details: `Admin ${session.username} ${newStatus === "active" ? "activated" : "deactivated"} user ${userId}`,
    })

    revalidatePath("/admin/settings")
    return { success: true, newStatus }
  } catch (error: any) {
    console.error("[User Management] Error toggling user status:", error)
    return { success: false, error: error.message || "Failed to toggle user status" }
  }
}
