import { NextRequest, NextResponse } from "next/server"
import { getSession, getSupplierSession } from "@/lib/auth/session"
import { 
  getNotificationsForRecipient, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  markMultipleNotificationsAsRead
} from "@/lib/services/notifications"

// GET /api/notifications - Fetch notifications for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const includeRead = searchParams.get("includeRead") !== "false"
    const onlyCount = searchParams.get("onlyCount") === "true"

    // Determine user type and ID from session
    let recipientType: "user" | "supplier"
    let recipientId: number

    // Try admin/AP user session first
    const userSession = await getSession()
    if (userSession) {
      recipientType = "user"
      recipientId = userSession.userId
    } else {
      // Try supplier session
      const supplierSession = await getSupplierSession()
      if (supplierSession) {
        recipientType = "supplier"
        recipientId = supplierSession.supplierId
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    if (onlyCount) {
      // Only return unread count
      const unreadCount = await getUnreadNotificationCount(recipientType, recipientId)
      return NextResponse.json({ unreadCount })
    }

    // Get notifications
    const notifications = await getNotificationsForRecipient(
      recipientType, 
      recipientId, 
      limit, 
      includeRead
    )

    // Also get unread count
    const unreadCount = await getUnreadNotificationCount(recipientType, recipientId)

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    })

  } catch (error) {
    console.error("[API] Notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// POST /api/notifications - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationIds } = body

    if (action !== "markAsRead") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Check authentication first
    const userSession = await getSession()
    const supplierSession = !userSession ? await getSupplierSession() : null

    if (!userSession && !supplierSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let success = false
    
    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark multiple notifications as read
      success = await markMultipleNotificationsAsRead(notificationIds)
    } else if (typeof notificationIds === "number") {
      // Mark single notification as read
      success = await markNotificationAsRead(notificationIds)
    } else {
      return NextResponse.json({ error: "Invalid notificationIds" }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
    }

  } catch (error) {
    console.error("[API] Notifications POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}