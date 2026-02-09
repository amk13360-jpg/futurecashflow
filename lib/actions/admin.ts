"use server"

import { query, transaction } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { manualGenerateOffersForSupplier } from "@/lib/actions/invoices"
import { sendSupplierApprovalEmail } from "@/lib/services/email"
import { createAuditLog } from "@/lib/auth/audit"
import { randomBytes } from "crypto"
import type { PoolConnection } from "mysql2/promise"

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString("hex")
}

// Get dashboard metrics
export async function getDashboardMetrics() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    // Pending documents count
    const [pendingDocs] = await query<[{ count: number }]>(
      `SELECT COUNT(*) as count FROM cession_agreements WHERE status = 'pending'`,
    )

    // Total applications
    const [totalApps] = await query<[{ count: number }]>(
      `SELECT COUNT(*) as count FROM suppliers WHERE onboarding_status IN ('pending', 'documents_submitted')`,
    )

    // Registered suppliers
    const [registeredSuppliers] = await query<[{ count: number }]>(
      `SELECT COUNT(*) as count FROM suppliers WHERE onboarding_status = 'approved'`,
    )

    // 48h payments issued
    const [recentPayments] = await query<[{ total: number }]>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments 
       WHERE status = 'completed' AND completed_date >= DATE_SUB(NOW(), INTERVAL 48 HOUR)`,
    )

    return {
      pendingDocuments: pendingDocs.count,
      totalApplications: totalApps.count,
      registeredSuppliers: registeredSuppliers.count,
      paymentsIssued48h: recentPayments.total,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard metrics:", error)
    throw error
  }
}

// Get pending supplier applications
export async function getPendingApplications() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const applications = await query(
      `SELECT supplier_id, name, vat_no, contact_email, contact_phone, 
              onboarding_status, created_at
       FROM suppliers 
       WHERE onboarding_status IN ('pending', 'documents_submitted')
       ORDER BY created_at DESC`,
    )

    return applications
  } catch (error) {
    console.error("[v0] Error fetching pending applications:", error)
    throw error
  }
}

// Get pending cession agreements
export async function getPendingCessions() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const cessions = await query(
      `SELECT c.cession_id, c.supplier_id, c.document_url, c.document_type, 
              c.signed_date, c.status, c.created_at,
              s.name as supplier_name, s.contact_email
       FROM cession_agreements c
       JOIN suppliers s ON c.supplier_id = s.supplier_id
       WHERE c.status IN ('pending', 'signed')
       ORDER BY c.created_at DESC`,
    )

    return cessions
  } catch (error) {
    console.error("[v0] Error fetching pending cessions:", error)
    throw error
  }
}

export async function getCessionById(cessionId: number) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const cessions = await query(
      `SELECT c.cession_id, c.supplier_id, c.document_url, c.document_type,
              c.version, c.signed_date, c.status, c.approved_by, c.approved_at,
              c.created_at, c.updated_at,
              s.name as supplier_name, s.contact_email, s.contact_person, s.address
       FROM cession_agreements c
       JOIN suppliers s ON c.supplier_id = s.supplier_id
       WHERE c.cession_id = ?
       LIMIT 1`,
      [cessionId],
    )

    return cessions[0] || null
  } catch (error) {
    console.error("[v0] Error fetching cession agreement:", error)
    throw error
  }
}

export async function reviewCessionAgreement(cessionId: number, status: "approved" | "rejected") {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    await query(
      `UPDATE cession_agreements
       SET status = ?, approved_by = ?, approved_at = NOW()
       WHERE cession_id = ?`,
      [status, session.userId, cessionId],
    )

    if (status === "approved") {
      const suppliers = await query<Array<{ supplier_id: number; onboarding_status: string }>>(
        `SELECT s.supplier_id, s.onboarding_status
         FROM suppliers s
         JOIN cession_agreements c ON c.supplier_id = s.supplier_id
         WHERE c.cession_id = ?
         LIMIT 1`,
        [cessionId],
      )

      // NOTE: Cession approval no longer triggers automatic supplier approval/offer creation
      // Admin must explicitly manage supplier approval and offer release separately
    }
  } catch (error) {
    console.error("[v0] Error updating cession status:", error)
    throw error
  }
}

// Get bank change requests
export async function getBankChangeRequests() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const requests = await query(
      `SELECT b.request_id, b.supplier_id, b.new_bank_name, b.new_account_no,
              b.new_branch_code, b.reason, b.status, b.created_at,
              s.name as supplier_name, s.contact_email,
              s.bank_name as current_bank_name, s.bank_account_no as current_account_no,
              s.bank_branch_code as current_branch_code
       FROM bank_change_requests b
       JOIN suppliers s ON b.supplier_id = s.supplier_id
       WHERE b.status = 'pending'
       ORDER BY b.created_at DESC`,
    )

    return requests
  } catch (error) {
    console.error("[v0] Error fetching bank change requests:", error)
    throw error
  }
}

// Approve bank change request
export async function approveBankChangeRequest(requestId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await transaction(async (connection: PoolConnection) => {
      // Get the request details
      const [requests]: any = await connection.execute(
        `SELECT * FROM bank_change_requests WHERE request_id = ? AND status = 'pending'`,
        [requestId]
      )

      if (!requests || requests.length === 0) {
        throw new Error("Request not found or already processed")
      }

      const request = requests[0]

      // Update supplier bank details
      await connection.execute(
        `UPDATE suppliers 
         SET bank_name = ?, bank_account_no = ?, bank_branch_code = ?, updated_at = NOW()
         WHERE supplier_id = ?`,
        [request.new_bank_name, request.new_account_no, request.new_branch_code, request.supplier_id]
      )

      // Update request status
      await connection.execute(
        `UPDATE bank_change_requests 
         SET status = 'approved', reviewed_by = ?, reviewed_at = NOW()
         WHERE request_id = ?`,
        [session.userId, requestId]
      )
    })

    await createAuditLog({
      userType: "admin",
      action: "BANK_CHANGE_APPROVED",
      entityType: "bank_change_request",
      entityId: requestId,
      details: `Admin ${session.username} approved bank change request`,
    })

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error approving bank change request:", error)
    return { success: false, error: error.message || "Failed to approve request" }
  }
}

// Reject bank change request
export async function rejectBankChangeRequest(
  requestId: number, 
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await query(
      `UPDATE bank_change_requests 
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ?
       WHERE request_id = ? AND status = 'pending'`,
      [session.userId, reason || null, requestId]
    )

    await createAuditLog({
      userType: "admin",
      action: "BANK_CHANGE_REJECTED",
      entityType: "bank_change_request",
      entityId: requestId,
      details: `Admin ${session.username} rejected bank change request${reason ? `: ${reason}` : ''}`,
    })

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error rejecting bank change request:", error)
    return { success: false, error: error.message || "Failed to reject request" }
  }
}

// Get all bank change requests (including processed)
export async function getAllBankChangeRequests() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const requests = await query(
      `SELECT b.request_id, b.supplier_id, b.new_bank_name, b.new_account_no,
              b.new_branch_code, b.reason, b.status, b.created_at, b.reviewed_at,
              b.rejection_reason,
              s.name as supplier_name, s.contact_email,
              s.bank_name as current_bank_name, s.bank_account_no as current_account_no,
              s.bank_branch_code as current_branch_code,
              u.username as reviewed_by_username
       FROM bank_change_requests b
       JOIN suppliers s ON b.supplier_id = s.supplier_id
       LEFT JOIN users u ON b.reviewed_by = u.user_id
       ORDER BY b.created_at DESC`,
    )

    return requests
  } catch (error) {
    console.error("[v0] Error fetching all bank change requests:", error)
    throw error
  }
}

export async function getSupplierApplicationById(supplierId: number) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const results = await query(
      `SELECT s.*, b.name AS buyer_name
       FROM suppliers s
       LEFT JOIN buyers b ON s.company_code = b.code
       WHERE s.supplier_id = ?
       LIMIT 1`,
      [supplierId],
    )

    return results[0] || null
  } catch (error) {
    console.error("[v0] Error fetching supplier application:", error)
    throw error
  }
}

export async function reviewSupplierApplication(
  supplierId: number,
  status: "approved" | "pending" | "rejected" | "documents_submitted",
) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    await query(
      `UPDATE suppliers
       SET onboarding_status = ?, updated_at = NOW()
       WHERE supplier_id = ?`,
      [status, supplierId],
    )

    if (status === "approved") {
      // NOTE: Automatic offer creation is DISABLED
      // Only admin can manually release offers via releaseOffersForSupplier()
      // Create access token and send approval email
      try {
        // Get supplier details
        const suppliers = await query<Array<{ contact_email: string; name: string }>>(
          `SELECT contact_email, name FROM suppliers WHERE supplier_id = ?`,
          [supplierId]
        )
        
        if (suppliers.length > 0) {
          const supplier = suppliers[0]
          
          // Always create a NEW approval token when admin approves
          // This is different from the initial 'invite' token sent during vendor upload
          const token = generateToken()
          const tokenExpiry = new Date()
          tokenExpiry.setDate(tokenExpiry.getDate() + 14)
          
          await query(
            `INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at)
             VALUES (?, ?, 'approval', ?)`,
            [supplierId, token, tokenExpiry]
          )
          
          console.log(`[Admin] Created approval token for supplier ${supplierId}`)
          
          // Generate access link
          const baseUrl = process.env.NEXTAUTH_URL || "https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net"
          const accessLink = `${baseUrl}/supplier/access?token=${token}`
          
          // Send approval email (for dashboard access to view early payment offers)
          console.log(`[Admin] Sending approval email to ${supplier.contact_email}`)
          const emailSent = await sendSupplierApprovalEmail(
            supplier.contact_email,
            supplier.name,
            accessLink
          )
          
          if (emailSent) {
            console.log(`[Admin] Approval email sent successfully to ${supplier.contact_email}`)
          } else {
            console.error(`[Admin] Failed to send approval email to ${supplier.contact_email}`)
          }
        }
      } catch (emailError) {
        // Don't fail the approval if email fails - just log it
        console.error(`[Admin] Failed to send approval email for supplier ${supplierId}:`, emailError)
      }
    }
  } catch (error) {
    console.error("[v0] Error updating supplier status:", error)
    throw error
  }
}

// Get all suppliers
export async function getAllSuppliers() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const suppliers = await query(
      `SELECT supplier_id, name, vat_no, contact_email, contact_phone,
              bank_name, bank_account_no, risk_tier, onboarding_status, 
              active_status, created_at
       FROM suppliers 
       ORDER BY created_at DESC`,
    )

    return suppliers
  } catch (error) {
    console.error("[v0] Error fetching suppliers:", error)
    throw error
  }
}

// Get recent payments
export async function getRecentPayments() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const payments = await query(
      `SELECT p.payment_id, p.amount, p.currency, p.payment_reference,
              p.status, p.scheduled_date, p.completed_date, p.batch_id,
              s.name as supplier_name, s.contact_email
       FROM payments p
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       ORDER BY p.created_at DESC
       LIMIT 50`,
    )

    return payments
  } catch (error) {
    console.error("[v0] Error fetching recent payments:", error)
    throw error
  }
}

/**
 * ADMIN ONLY: Manually release offers for a supplier
 * This is the ONLY way offers can be created in the system
 * Automatic offer creation is disabled entirely
 */
export async function releaseOffersForSupplier(
  supplierId: number,
  invoiceIds?: number[],
): Promise<{ success: boolean; offersCreated?: number; error?: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const result = await manualGenerateOffersForSupplier(supplierId, "admin_manual_release")
    
    await createAuditLog({
      userType: "admin",
      action: "MANUAL_OFFERS_RELEASED",
      entityType: "supplier",
      entityId: supplierId,
      details: `Admin manually released ${result.created.length} offers for supplier ${supplierId}`,
    })

    return {
      success: true,
      offersCreated: result.created.length,
    }
  } catch (error: any) {
    console.error("[Admin] Error releasing offers:", error)
    return {
      success: false,
      error: error.message || "Failed to release offers",
    }
  }
}
