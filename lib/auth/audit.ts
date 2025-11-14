import { query } from "@/lib/db"

interface AuditLogData {
  userId?: number
  userType: "admin" | "accounts_payable" | "supplier" | "system"
  action: string
  entityType?: string
  entityId?: number
  details?: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  await query(
    `INSERT INTO audit_logs (user_id, user_type, action, entity_type, entity_id, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId || null,
      data.userType,
      data.action,
      data.entityType || null,
      data.entityId || null,
      data.details || null,
      data.ipAddress || null,
      data.userAgent || null,
    ],
  )
}
