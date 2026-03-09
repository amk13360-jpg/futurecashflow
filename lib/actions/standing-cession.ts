"use server"

import { query, transaction } from "@/lib/db"
import { getSupplierSession, getSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { revalidatePath } from "next/cache"
import type { RowDataPacket } from "mysql2"

// Types
export interface StandingCession {
  cession_id: number
  supplier_id: number
  supplier_name: string
  buyer_id: number
  buyer_name: string
  document_url: string | null
  document_type: string
  version: string
  signed_date: string | null
  valid_until: string | null
  status: "pending" | "signed" | "buyer_approved" | "approved" | "rejected" | "expired"
  is_standing: boolean
  standing_valid_until: string | null
  created_at: string
  updated_at: string
}

export interface CessionAddendum {
  cession_id: number
  supplier_id: number
  parent_cession_id: number | null
  trigger_reason: string | null
  linked_invoice_ids: string | null
  total_amount: number
  document_url: string | null
  status: string
  created_at: string
}

/**
 * Get the current standing cession for a supplier
 */
export async function getStandingCession(): Promise<StandingCession | null> {
  const session = await getSupplierSession()
  if (!session) {
    return null
  }

  try {
    const cessions = await query<RowDataPacket[]>(
      `SELECT ca.*, s.name as supplier_name, b.name as buyer_name
       FROM cession_agreements ca
       JOIN suppliers s ON ca.supplier_id = s.supplier_id
       LEFT JOIN buyers b ON ca.buyer_id = b.buyer_id
       WHERE ca.supplier_id = ?
         AND ca.is_standing = 1
         AND ca.status IN ('signed', 'buyer_approved', 'approved')
         AND (ca.standing_valid_until IS NULL OR ca.standing_valid_until > NOW())
       ORDER BY ca.created_at DESC
       LIMIT 1`,
      [session.supplierId]
    )

    return cessions.length > 0 ? (cessions[0] as unknown as StandingCession) : null
  } catch (error) {
    console.error("[Standing Cession] Error fetching standing cession:", error)
    throw error
  }
}

/**
 * Check if supplier has a valid standing cession
 */
export async function hasValidStandingCession(): Promise<boolean> {
  const cession = await getStandingCession()
  return cession !== null
}

/**
 * Get all addendums for a standing cession
 */
export async function getCessionAddendums(standingCessionId: number): Promise<CessionAddendum[]> {
  const session = await getSupplierSession()
  if (!session) {
    return []
  }

  try {
    const addendums = await query<RowDataPacket[]>(
      `SELECT ca.*, 
              (SELECT SUM(COALESCE(i.amount, 0))
               FROM invoices i 
               WHERE FIND_IN_SET(i.invoice_id, REPLACE(REPLACE(ca.linked_invoice_ids, '[', ''), ']', ''))
              ) as total_amount
       FROM cession_agreements ca
       WHERE ca.parent_cession_id = ?
         AND ca.supplier_id = ?
       ORDER BY ca.created_at DESC`,
      [standingCessionId, session.supplierId]
    )

    return addendums as unknown as CessionAddendum[]
  } catch (error) {
    console.error("[Standing Cession] Error fetching addendums:", error)
    throw error
  }
}

/**
 * Create a standing cession for a supplier
 */
export async function createStandingCession(
  buyerId: number,
  validMonths: number = 12
): Promise<{ success: boolean; cessionId?: number; error?: string }> {
  const session = await getSupplierSession()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validUntil = new Date()
    validUntil.setMonth(validUntil.getMonth() + validMonths)

    const result = await query<RowDataPacket[]>(
      `INSERT INTO cession_agreements (
        supplier_id, buyer_id, document_type, version, status, 
        is_standing, standing_valid_until, created_at, updated_at
      ) VALUES (?, ?, 'standing_cession', 'v1', 'pending', 1, ?, NOW(), NOW())`,
      [session.supplierId, buyerId, validUntil]
    )

    const insertResult = result as any
    const cessionId = insertResult.insertId

    await createAuditLog({
      userType: "supplier",
      action: "STANDING_CESSION_CREATED",
      entityType: "cession_agreement",
      entityId: cessionId,
      details: `Supplier ${session.name} created standing cession for buyer ${buyerId}`,
    })

    revalidatePath("/supplier/cession-agreement")
    return { success: true, cessionId }
  } catch (error: any) {
    console.error("[Standing Cession] Error creating standing cession:", error)
    return { success: false, error: error.message || "Failed to create standing cession" }
  }
}

/**
 * Sign a standing cession (update with signature/document)
 */
export async function signStandingCession(
  cessionId: number,
  documentUrl: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSupplierSession()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await query(
      `UPDATE cession_agreements 
       SET document_url = ?, signed_date = NOW(), status = 'signed', updated_at = NOW()
       WHERE cession_id = ? AND supplier_id = ? AND is_standing = 1`,
      [documentUrl, cessionId, session.supplierId]
    )

    await createAuditLog({
      userType: "supplier",
      action: "STANDING_CESSION_SIGNED",
      entityType: "cession_agreement",
      entityId: cessionId,
      details: `Supplier ${session.name} signed standing cession`,
    })

    // Generate login credentials immediately after signing
    await generateSupplierCredentialsAfterSigning(session.supplierId, session.email, session.name)

    revalidatePath("/supplier/cession-agreement")
    return { success: true }
  } catch (error: any) {
    console.error("[Standing Cession] Error signing standing cession:", error)
    return { success: false, error: error.message || "Failed to sign standing cession" }
  }
}

/**
 * Generate supplier credentials immediately after cession signing
 */
export async function generateSupplierCredentialsAfterSigning(
  supplierId: number,
  supplierEmail: string,
  supplierName: string
): Promise<void> {
  try {
    // Check if supplier already has credentials
    const noCredentials = await query<any[]>(
      "SELECT supplier_id FROM suppliers WHERE supplier_id = ? AND password_hash IS NULL",
      [supplierId]
    )
    
    if (noCredentials.length === 0) {
      console.log(`[Credentials] Supplier ${supplierEmail} already has credentials`)
      return
    }

    // Generate and send credentials immediately after signing
    const { generateTemporaryPassword, hashPassword } = await import("@/lib/auth/password")
    const { sendSupplierCredentialsEmail } = await import("@/lib/services/email")
    
    const tempPassword = generateTemporaryPassword()
    const passwordHash = await hashPassword(tempPassword)
    
    await query(
      "UPDATE suppliers SET password_hash = ?, password_set_at = NOW() WHERE supplier_id = ?",
      [passwordHash, supplierId]
    )
    
    await sendSupplierCredentialsEmail(supplierEmail, supplierName, tempPassword)
    
    console.log(`[Credentials] Generated and emailed to ${supplierEmail} immediately after cession signing`)
  } catch (credError) {
    console.error("[Credentials] Error generating supplier credentials after signing:", credError)
  }
}

/**
 * Create an addendum for accepted offers
 * This is called automatically when offers are accepted
 */
export async function createCessionAddendum(
  invoiceIds: number[],
  triggerReason: string = "offer_acceptance"
): Promise<{ success: boolean; addendumId?: number; error?: string }> {
  const session = await getSupplierSession()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get the standing cession
    const standingCession = await getStandingCession()
    if (!standingCession) {
      return { success: false, error: "No valid standing cession found. Please sign a standing cession first." }
    }

    // Get the buyer ID from the invoices
    const invoices = await query<RowDataPacket[]>(
      `SELECT buyer_id FROM invoices WHERE invoice_id IN (?) LIMIT 1`,
      [invoiceIds]
    )

    if (invoices.length === 0) {
      return { success: false, error: "No invoices found" }
    }

    const buyerId = invoices[0].buyer_id

    // Create the addendum
    const linkedInvoiceIds = JSON.stringify(invoiceIds)
    const result = await query<RowDataPacket[]>(
      `INSERT INTO cession_agreements (
        supplier_id, buyer_id, parent_cession_id, document_type, version, status,
        is_standing, trigger_reason, linked_invoice_ids, created_at, updated_at
      ) VALUES (?, ?, ?, 'addendum', 'v1', 'pending', 0, ?, ?, NOW(), NOW())`,
      [session.supplierId, buyerId, standingCession.cession_id, triggerReason, linkedInvoiceIds]
    )

    const insertResult = result as any
    const addendumId = insertResult.insertId

    await createAuditLog({
      userType: "supplier",
      action: "CESSION_ADDENDUM_CREATED",
      entityType: "cession_agreement",
      entityId: addendumId,
      details: `Addendum created for ${invoiceIds.length} invoice(s), linked to standing cession ${standingCession.cession_id}`,
    })

    revalidatePath("/supplier/cession-agreement")
    return { success: true, addendumId }
  } catch (error: any) {
    console.error("[Standing Cession] Error creating addendum:", error)
    return { success: false, error: error.message || "Failed to create addendum" }
  }
}

/**
 * Get cession status for supplier dashboard
 */
export async function getSupplierCessionStatus(): Promise<{
  hasStandingCession: boolean
  standingCession: StandingCession | null
  pendingAddendums: number
  totalAddendums: number
}> {
  const session = await getSupplierSession()
  if (!session) {
    return {
      hasStandingCession: false,
      standingCession: null,
      pendingAddendums: 0,
      totalAddendums: 0,
    }
  }

  try {
    const standingCession = await getStandingCession()
    
    if (!standingCession) {
      return {
        hasStandingCession: false,
        standingCession: null,
        pendingAddendums: 0,
        totalAddendums: 0,
      }
    }

    const addendumCounts = await query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM cession_agreements
       WHERE parent_cession_id = ? AND supplier_id = ?`,
      [standingCession.cession_id, session.supplierId]
    )

    const counts = addendumCounts[0] || { total: 0, pending: 0 }

    return {
      hasStandingCession: true,
      standingCession,
      pendingAddendums: Number(counts.pending) || 0,
      totalAddendums: Number(counts.total) || 0,
    }
  } catch (error) {
    console.error("[Standing Cession] Error getting cession status:", error)
    return {
      hasStandingCession: false,
      standingCession: null,
      pendingAddendums: 0,
      totalAddendums: 0,
    }
  }
}

/**
 * Admin: Approve a standing cession
 */
export async function approveStandingCession(
  cessionId: number
): Promise<{ success: boolean; error?: string }> {
  // Verify admin authentication
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Admin access required' }
  }

  try {
    await query(
      `UPDATE cession_agreements 
       SET status = 'approved', updated_at = NOW()
       WHERE cession_id = ? AND is_standing = 1`,
      [cessionId]
    )

    await createAuditLog({
      userType: "admin",
      action: "STANDING_CESSION_APPROVED",
      entityType: "cession_agreement",
      entityId: cessionId,
      details: `Admin approved standing cession`,
    })

    revalidatePath("/admin/documents")
    return { success: true }
  } catch (error: any) {
    console.error("[Standing Cession] Error approving standing cession:", error)
    return { success: false, error: error.message || "Failed to approve standing cession" }
  }
}

/**
 * Admin: Approve an addendum
 */
export async function approveAddendum(
  addendumId: number
): Promise<{ success: boolean; error?: string }> {
  // Verify admin authentication
  const adminSession = await getSession()
  if (!adminSession || adminSession.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Admin access required' }
  }

  try {
    await query(
      `UPDATE cession_agreements 
       SET status = 'approved', updated_at = NOW()
       WHERE cession_id = ? AND parent_cession_id IS NOT NULL`,
      [addendumId]
    )

    await createAuditLog({
      userType: "admin",
      action: "ADDENDUM_APPROVED",
      entityType: "cession_agreement",
      entityId: addendumId,
      details: `Admin approved addendum`,
    })

    revalidatePath("/admin/documents")
    return { success: true }
  } catch (error: any) {
    console.error("[Standing Cession] Error approving addendum:", error)
    return { success: false, error: error.message || "Failed to approve addendum" }
  }
}
