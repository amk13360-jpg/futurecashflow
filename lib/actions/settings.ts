"use server"

import { query } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

// Get all system settings
export async function getSystemSettings() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const results = await query(`
      SELECT setting_key, setting_value, setting_type, description
      FROM system_settings
      ORDER BY setting_key
    `)

    // Convert array to object for easier access
    const settings: any = {}
    for (const row of results as any[]) {
      settings[row.setting_key] = row.setting_value
    }

    return settings
  } catch (error) {
    console.error("[v0] Error fetching system settings:", error)
    // Return default settings if table doesn't exist yet
    return {
      platform_name: "FMF Supply Chain Finance",
      support_email: "support@fmfscf.com",
      support_phone: "+27 11 123 4567",
      default_currency: "ZAR",
      min_discount_rate: "5.00",
      max_discount_rate: "15.00",
      offer_expiry_days: "7",
      min_invoice_amount: "1000.00",
      max_invoice_amount: "10000000.00",
      email_notifications_enabled: "true",
      sms_notifications_enabled: "false",
      session_timeout_minutes: "30",
      max_login_attempts: "5",
      password_min_length: "8",
      require_strong_passwords: "true",
      require_2fa: "false",
      maintenance_mode: "false",
    }
  }
}

// Update a system setting
export async function updateSystemSetting(key: string, value: string) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    // Check if setting exists
    const existing = await query(`SELECT setting_id FROM system_settings WHERE setting_key = ?`, [key])

    if ((existing as any[]).length > 0) {
      // Update existing setting
      await query(
        `UPDATE system_settings 
         SET setting_value = ?, updated_by = ?, updated_at = NOW() 
         WHERE setting_key = ?`,
        [value, session.userId, key],
      )
    } else {
      // Insert new setting
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) 
         VALUES (?, ?, 'string', ?)`,
        [key, value, session.userId],
      )
    }

    // Log the change
    await query(
      `INSERT INTO audit_logs (user_id, user_type, action, entity_type, entity_id, details) 
       VALUES (?, 'admin', 'update_setting', 'system_settings', NULL, ?)`,
      [session.userId, `Updated ${key} to ${value}`],
    )

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating system setting:", error)
    throw new Error("Failed to update setting")
  }
}

// Get a specific setting value
export async function getSettingValue(key: string, defaultValue = "") {
  try {
    const result = await query(`SELECT setting_value FROM system_settings WHERE setting_key = ?`, [key])

    if ((result as any[]).length > 0) {
      return (result as any[])[0].setting_value
    }

    return defaultValue
  } catch (error) {
    console.error("[v0] Error fetching setting value:", error)
    return defaultValue
  }
}
