"use server"

import { query } from "@/lib/db"
import type { RowDataPacket } from "mysql2"
import type { Notification, NotificationRule } from "@/lib/types/database"

export interface CreateNotificationParams {
  recipientType: "supplier" | "user"
  recipientId: number
  notificationType: string
  subject?: string
  message: string
  channel?: "email" | "sms" | "in_app"
  metadata?: any
}

export interface NotificationWithMetadata extends Notification {
  // Additional fields that might be useful for display
  timeAgo?: string
  icon?: string
  priority?: "low" | "medium" | "high"
}

/**
 * Create a new notification
 */
export async function createNotification(params: CreateNotificationParams): Promise<number | null> {
  try {
    const {
      recipientType,
      recipientId,
      notificationType,
      subject,
      message,
      channel = "in_app",
      metadata = null
    } = params

    const result = await query<RowDataPacket[]>(
      `INSERT INTO notifications 
       (recipient_type, recipient_id, notification_type, subject, message, channel, metadata, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        recipientType,
        recipientId,
        notificationType,
        subject,
        message,
        channel,
        metadata ? JSON.stringify(metadata) : null
      ]
    )

    const insertResult = result as any
    return insertResult.insertId || null
  } catch (error) {
    console.error("[NotificationService] Error creating notification:", error)
    return null
  }
}

/**
 * Get notifications for a user or supplier
 */
export async function getNotificationsForRecipient(
  recipientType: "supplier" | "user",
  recipientId: number,
  limit: number = 50,
  includeRead: boolean = true
): Promise<NotificationWithMetadata[]> {
  try {
    let whereClause = "WHERE recipient_type = ? AND recipient_id = ?"
    const queryParams: any[] = [recipientType, recipientId]

    if (!includeRead) {
      whereClause += " AND status NOT IN ('read')"
    }

    const notifications = await query<RowDataPacket[]>(
      `SELECT notification_id, recipient_type, recipient_id, notification_type,
              subject, message, channel, status, sent_at, read_at, metadata, created_at
       FROM notifications 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ?`,
      [...queryParams, limit]
    )

    return notifications.map((n: any) => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
      timeAgo: formatTimeAgo(new Date(n.created_at)),
      icon: getNotificationIcon(n.notification_type),
      priority: getNotificationPriority(n.notification_type)
    })) as NotificationWithMetadata[]

  } catch (error) {
    console.error("[NotificationService] Error fetching notifications:", error)
    return []
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<boolean> {
  try {
    await query(
      "UPDATE notifications SET status = 'read', read_at = NOW() WHERE notification_id = ?",
      [notificationId]
    )
    return true
  } catch (error) {
    console.error("[NotificationService] Error marking notification as read:", error)
    return false
  }
}

/**
 * Mark multiple notifications as read
 */
export async function markMultipleNotificationsAsRead(notificationIds: number[]): Promise<boolean> {
  try {
    if (notificationIds.length === 0) return true

    const placeholders = notificationIds.map(() => '?').join(',')
    await query(
      `UPDATE notifications SET status = 'read', read_at = NOW() WHERE notification_id IN (${placeholders})`,
      notificationIds
    )
    return true
  } catch (error) {
    console.error("[NotificationService] Error marking multiple notifications as read:", error)
    return false
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  recipientType: "supplier" | "user",
  recipientId: number
): Promise<number> {
  try {
    const result = await query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_type = ? AND recipient_id = ? AND status NOT IN ('read')",
      [recipientType, recipientId]
    )
    return (result[0] as any)?.count || 0
  } catch (error) {
    console.error("[NotificationService] Error getting unread count:", error)
    return 0
  }
}

/**
 * Delete old notifications (cleanup job)
 */
export async function cleanupOldNotifications(daysOld: number = 30): Promise<number> {
  try {
    const result = await query(
      "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [daysOld]
    )
    const deleteResult = result as any
    return deleteResult.affectedRows || 0
  } catch (error) {
    console.error("[NotificationService] Error cleaning up old notifications:", error)
    return 0
  }
}

// Helper functions for notification display
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  
  return date.toLocaleDateString()
}

function getNotificationIcon(notificationType: string): string {
  const iconMap: Record<string, string> = {
    "new_offer": "💰",
    "offer_accepted": "✅",
    "offer_rejected": "❌",
    "offer_expired": "⏰",
    "payment_completed": "💳",
    "payment_failed": "⚠️",
    "invoice_uploaded": "📄",
    "cession_approval_required": "📝",
    "cession_approved": "✅",
    "cession_rejected": "❌",
    "bank_change_requested": "🏦",
    "bank_change_approved": "✅",
    "bank_change_rejected": "❌",
    "application_approved": "🎉",
    "application_rejected": "❌",
    "document_required": "📎",
    "system_maintenance": "🔧",
    "security_alert": "🔒",
    "default": "🔔"
  }
  return iconMap[notificationType] || iconMap.default
}

function getNotificationPriority(notificationType: string): "low" | "medium" | "high" {
  const highPriority = ["payment_failed", "security_alert", "offer_expired"]
  const mediumPriority = ["new_offer", "payment_completed", "cession_approval_required"]
  
  if (highPriority.includes(notificationType)) return "high"
  if (mediumPriority.includes(notificationType)) return "medium"
  return "low"
}

// Specific notification creator functions for common events
export async function createOfferNotification(
  supplierId: number, 
  offerCount: number, 
  totalValue: number, 
  buyerName: string
): Promise<number | null> {
  return await createNotification({
    recipientType: "supplier",
    recipientId: supplierId,
    notificationType: "new_offer",
    subject: `${offerCount} New Early Payment Offer${offerCount > 1 ? 's' : ''}`,
    message: `You have ${offerCount} new early payment offer${offerCount > 1 ? 's' : ''} from ${buyerName}`,
    metadata: {
      offerCount,
      totalValue,
      buyerName,
      actionRequired: true
    }
  })
}

export async function createPaymentNotification(
  supplierId: number,
  amount: number,
  paymentReference: string,
  status: "completed" | "failed"
): Promise<number | null> {
  const isSuccess = status === "completed"
  return await createNotification({
    recipientType: "supplier",
    recipientId: supplierId,
    notificationType: isSuccess ? "payment_completed" : "payment_failed",
    subject: isSuccess ? "Payment Processed" : "Payment Failed",
    message: isSuccess 
      ? `Payment of R${amount.toLocaleString()} has been processed successfully`
      : `Payment of R${amount.toLocaleString()} has failed. Please contact support.`,
    metadata: {
      amount,
      paymentReference,
      status,
      actionRequired: !isSuccess
    }
  })
}

export async function createInvoiceNotification(
  userId: number,
  invoiceNumber: string,
  supplierName: string,
  amount: number
): Promise<number | null> {
  return await createNotification({
    recipientType: "user",
    recipientId: userId,
    notificationType: "invoice_uploaded",
    subject: "New Invoice Uploaded",
    message: `Invoice ${invoiceNumber} from ${supplierName} uploaded (R${amount.toLocaleString()})`,
    metadata: {
      invoiceNumber,
      supplierName,
      amount,
      actionRequired: false
    }
  })
}

export async function createCessionApprovalNotification(
  userId: number,
  supplierName: string,
  cessionId: number
): Promise<number | null> {
  return await createNotification({
    recipientType: "user",
    recipientId: userId,
    notificationType: "cession_approval_required",
    subject: "Cession Agreement Approval Required",
    message: `Cession agreement from ${supplierName} requires approval`,
    metadata: {
      supplierName,
      cessionId,
      actionRequired: true
    }
  })
}

export async function createBankChangeNotification(
  userId: number,
  supplierName: string,
  requestId: number
): Promise<number | null> {
  return await createNotification({
    recipientType: "user",
    recipientId: userId,
    notificationType: "bank_change_requested",
    subject: "Bank Change Request",
    message: `${supplierName} has requested a bank detail change`,
    metadata: {
      supplierName,
      requestId,
      actionRequired: true
    }
  })
}