"use server"

import { query } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

// Get offer acceptance summary report
export async function getOfferAcceptanceSummary(filters?: {
  startDate?: string
  endDate?: string
  buyerId?: number
  supplierId?: number
}) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    let sql = `
      SELECT 
        DATE(o.sent_at) as date,
        b.name as buyer_name,
        s.name as supplier_name,
        COUNT(*) as total_offers,
        SUM(CASE WHEN o.status = 'accepted' THEN 1 ELSE 0 END) as accepted_offers,
        SUM(CASE WHEN o.status = 'rejected' THEN 1 ELSE 0 END) as rejected_offers,
        SUM(CASE WHEN o.status = 'expired' THEN 1 ELSE 0 END) as expired_offers,
        SUM(o.net_payment_amount) as total_value,
        SUM(CASE WHEN o.status = 'accepted' THEN o.net_payment_amount ELSE 0 END) as accepted_value
      FROM offers o
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN suppliers s ON o.supplier_id = s.supplier_id
      WHERE 1=1
    `

    const params: any[] = []

    if (filters?.startDate) {
      sql += " AND o.sent_at >= ?"
      params.push(filters.startDate)
    }

    if (filters?.endDate) {
      sql += " AND o.sent_at <= ?"
      params.push(filters.endDate)
    }

    if (filters?.buyerId) {
      sql += " AND o.buyer_id = ?"
      params.push(filters.buyerId)
    }

    if (filters?.supplierId) {
      sql += " AND o.supplier_id = ?"
      params.push(filters.supplierId)
    }

    sql += " GROUP BY DATE(o.sent_at), b.name, s.name ORDER BY date DESC"

    const results = await query(sql, params)
    return results
  } catch (error) {
    console.error("[v0] Error fetching offer acceptance summary:", error)
    throw error
  }
}

// Get disbursement tracker report
export async function getDisbursementTracker(filters?: { startDate?: string; endDate?: string; status?: string }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    let sql = `
      SELECT 
        p.payment_id,
        p.payment_reference,
        p.batch_id,
        p.amount,
        p.currency,
        p.status,
        p.scheduled_date,
        p.completed_date,
        s.name as supplier_name,
        s.bank_name,
        s.bank_account_no,
        b.name as buyer_name,
        i.invoice_number,
        u.full_name as processed_by_name
      FROM payments p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      JOIN offers o ON p.offer_id = o.offer_id
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN invoices i ON o.invoice_id = i.invoice_id
      LEFT JOIN users u ON p.processed_by = u.user_id
      WHERE 1=1
    `

    const params: any[] = []

    if (filters?.startDate) {
      sql += " AND p.scheduled_date >= ?"
      params.push(filters.startDate)
    }

    if (filters?.endDate) {
      sql += " AND p.scheduled_date <= ?"
      params.push(filters.endDate)
    }

    if (filters?.status) {
      sql += " AND p.status = ?"
      params.push(filters.status)
    }

    sql += " ORDER BY p.scheduled_date DESC, p.payment_id DESC"

    const results = await query(sql, params)
    return results
  } catch (error) {
    console.error("[v0] Error fetching disbursement tracker:", error)
    throw error
  }
}

// Get supplier status report
export async function getSupplierStatusReport() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const results = await query(`
      SELECT 
        s.supplier_id,
        s.vendor_number,
        s.name,
        s.vat_no,
        s.contact_email,
        s.contact_phone,
        s.onboarding_status,
        s.active_status,
        s.bank_name,
        s.bank_account_no,
        s.created_at,
        s.approved_at,
        COUNT(DISTINCT i.invoice_id) as invoice_count,
        COUNT(DISTINCT o.offer_id) as offer_count,
        SUM(CASE WHEN o.status = 'accepted' THEN 1 ELSE 0 END) as accepted_offers,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_disbursed,
        MAX(ca.status) as cession_status,
        MAX(ca.signed_date) as cession_signed_date
      FROM suppliers s
      LEFT JOIN invoices i ON s.vendor_number = i.vendor_number AND s.company_code = i.company_code
      LEFT JOIN offers o ON s.supplier_id = o.supplier_id
      LEFT JOIN payments p ON o.offer_id = p.offer_id
      LEFT JOIN cession_agreements ca ON s.supplier_id = ca.supplier_id
      GROUP BY 
        s.supplier_id,
        s.vendor_number,
        s.name,
        s.vat_no,
        s.contact_email,
        s.contact_phone,
        s.onboarding_status,
        s.active_status,
        s.bank_name,
        s.bank_account_no,
        s.created_at,
        s.approved_at
      ORDER BY s.created_at DESC
    `)

    return results
  } catch (error) {
    console.error("[v0] Error fetching supplier status report:", error)
    throw error
  }
}

// Get audit history
export async function getAuditHistory(filters?: {
  startDate?: string
  endDate?: string
  userId?: number
  action?: string
  limit?: number
}) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    // Determine limit first
    let limit = 100
    if (filters?.limit !== undefined && filters?.limit !== null) {
      const parsed = parseInt(String(filters.limit), 10)
      if (!isNaN(parsed) && parsed > 0) {
        limit = parsed
      }
    }

    // Build SQL with hardcoded LIMIT to avoid mysql2 parameter issues
    let sql = `
      SELECT 
        a.log_id,
        a.user_id,
        a.user_type,
        a.action,
        a.entity_type,
        a.entity_id,
        a.details,
        a.ip_address,
        a.created_at,
        u.username,
        u.full_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE 1=1
    `

    const params: any[] = []

    if (filters?.startDate) {
      sql += " AND a.created_at >= ?"
      params.push(filters.startDate)
    }

    if (filters?.endDate) {
      sql += " AND a.created_at <= ?"
      params.push(filters.endDate)
    }

    if (filters?.userId) {
      sql += " AND a.user_id = ?"
      params.push(filters.userId)
    }

    if (filters?.action) {
      sql += " AND a.action LIKE ?"
      params.push(`%${filters.action}%`)
    }

    // Use hardcoded LIMIT instead of parameter to avoid mysql2 bug
    sql += ` ORDER BY a.created_at DESC LIMIT ${limit}`

    const results = await query(sql, params)
    return results
  } catch (error) {
    console.error("[v0] Error fetching audit history:", error)
    throw error
  }
}

// Get system statistics
export async function getSystemStatistics() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM suppliers WHERE active_status = 'active') as active_suppliers,
        (SELECT COUNT(*) FROM suppliers WHERE onboarding_status = 'pending') as pending_suppliers,
        (SELECT COUNT(*) FROM invoices WHERE status = 'matched') as matched_invoices,
        (SELECT COUNT(*) FROM offers WHERE status = 'sent') as pending_offers,
        (SELECT COUNT(*) FROM offers WHERE status = 'accepted') as accepted_offers,
        (SELECT COUNT(*) FROM payments WHERE status = 'queued') as queued_payments,
        (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completed_payments,
        (SELECT SUM(amount) FROM payments WHERE status = 'completed') as total_disbursed,
        (SELECT COUNT(*) FROM repayments WHERE status = 'pending') as pending_repayments,
        (SELECT COUNT(*) FROM repayments WHERE status = 'overdue') as overdue_repayments,
        (SELECT COUNT(*) FROM bank_change_requests WHERE status = 'pending') as pending_bank_changes,
        (SELECT COUNT(*) FROM cession_agreements WHERE status = 'pending') as pending_cessions
    `)

    return stats[0]
  } catch (error) {
    console.error("[v0] Error fetching system statistics:", error)
    throw error
  }
}

// Export report to CSV
export async function exportReportToCSV(reportType: string, data: any[]) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    if (data.length === 0) {
      throw new Error("No data to export")
    }

    // Get headers from first row
    const headers = Object.keys(data[0])

    // Generate CSV content
    const csvRows = data.map((row) => headers.map((header) => JSON.stringify(row[header] || "")).join(","))

    const csvContent = [headers.join(","), ...csvRows].join("\n")

    return {
      filename: `${reportType}_${new Date().toISOString().split("T")[0]}.csv`,
      content: csvContent,
    }
  } catch (error) {
    console.error("[v0] Error exporting report:", error)
    throw error
  }
}