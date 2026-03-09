"use server"

import { query } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ============================================================================
// Types
// ============================================================================

export interface BuyerCessionItem {
  cession_id: number
  supplier_id: number
  supplier_name: string
  supplier_email: string
  document_url: string | null
  document_type: string
  signed_date: string | null
  status: "pending" | "signed" | "buyer_approved" | "approved" | "rejected"
  is_standing: boolean
  buyer_approved_by: number | null
  buyer_approved_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Auth helper
// ============================================================================

async function getApSession() {
  const session = await getSession()
  if (!session || session.role !== "accounts_payable") {
    redirect("/login/ap")
  }
  if (!session.buyerId) {
    throw new Error("No buyer associated with this AP account")
  }
  return session as typeof session & { buyerId: number }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get ALL cession agreements for the buyer's suppliers (all statuses).
 */
export async function getAllBuyerCessions(): Promise<{
  success: boolean
  data?: BuyerCessionItem[]
  message?: string
}> {
  try {
    const session = await getApSession()

    const cessions = await query<BuyerCessionItem[]>(
      `SELECT ca.cession_id, ca.supplier_id,
              ca.document_url, ca.document_type, ca.signed_date,
              ca.status, ca.is_standing,
              ca.buyer_approved_by, ca.buyer_approved_at,
              ca.created_at, ca.updated_at,
              s.name AS supplier_name,
              s.contact_email AS supplier_email
       FROM cession_agreements ca
       JOIN suppliers s ON ca.supplier_id = s.supplier_id
       WHERE ca.buyer_id = ?
       ORDER BY
         FIELD(ca.status, 'signed', 'pending', 'buyer_approved', 'approved', 'rejected'),
         ca.updated_at DESC`,
      [session.buyerId]
    )

    return { success: true, data: cessions }
  } catch (error: any) {
    console.error("[BuyerCession] getAllBuyerCessions error:", error)
    return { success: false, message: error.message || "Failed to fetch cession agreements" }
  }
}

/**
 * Count of cessions awaiting buyer approval (status = 'signed').
 */
export async function countPendingBuyerCessions(): Promise<number> {
  try {
    const session = await getApSession()
    const rows = await query<Array<{ cnt: number }>>(
      `SELECT COUNT(*) AS cnt
       FROM cession_agreements
       WHERE buyer_id = ? AND status = 'signed'`,
      [session.buyerId]
    )
    return Number(rows[0]?.cnt ?? 0)
  } catch {
    return 0
  }
}

/**
 * Get a single cession agreement for review.
 * The buyer MUST own the cession (buyer_id = session.buyerId).
 */
export async function getBuyerCessionById(cessionId: number): Promise<{
  success: boolean
  data?: BuyerCessionItem
  message?: string
}> {
  try {
    const session = await getApSession()

    const rows = await query<BuyerCessionItem[]>(
      `SELECT ca.cession_id, ca.supplier_id,
              ca.document_url, ca.document_type, ca.signed_date,
              ca.status, ca.is_standing,
              ca.buyer_approved_by, ca.buyer_approved_at,
              ca.created_at, ca.updated_at,
              s.name AS supplier_name,
              s.contact_email AS supplier_email
       FROM cession_agreements ca
       JOIN suppliers s ON ca.supplier_id = s.supplier_id
       WHERE ca.cession_id = ? AND ca.buyer_id = ?
       LIMIT 1`,
      [cessionId, session.buyerId]
    )

    if (rows.length === 0) {
      return { success: false, message: "Cession agreement not found" }
    }

    return { success: true, data: rows[0] }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to fetch cession agreement" }
  }
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Buyer approves a cession agreement  (signed → buyer_approved).
 */
export async function approveCessionAsBuyer(
  cessionId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getApSession()

    // Ownership + status guard
    const rows = await query<Array<{ cession_id: number; status: string }>>(
      `SELECT cession_id, status
       FROM cession_agreements
       WHERE cession_id = ? AND buyer_id = ?
       LIMIT 1`,
      [cessionId, session.buyerId]
    )

    if (rows.length === 0) {
      return { success: false, error: "Cession agreement not found or access denied" }
    }
    if (rows[0].status !== "signed") {
      return {
        success: false,
        error: `Cannot approve — current status is "${rows[0].status}"`,
      }
    }

    await query(
      `UPDATE cession_agreements
       SET status = 'buyer_approved',
           buyer_approved_by = ?,
           buyer_approved_at = NOW(),
           updated_at = NOW()
       WHERE cession_id = ?`,
      [session.userId, cessionId]
    )

    await createAuditLog({
      userId: session.userId,
      userType: "accounts_payable",
      action: "BUYER_CESSION_APPROVED",
      entityType: "cession_agreement",
      entityId: cessionId,
      details: `AP user ${session.username} (buyer_id=${session.buyerId}) approved cession #${cessionId}`,
    })

    revalidatePath("/ap/cession-agreements")
    return { success: true }
  } catch (error: any) {
    console.error("[BuyerCession] approveCessionAsBuyer error:", error)
    return { success: false, error: error.message || "Failed to approve cession agreement" }
  }
}

/**
 * Buyer rejects a cession agreement  (signed → rejected).
 */
export async function rejectCessionAsBuyer(
  cessionId: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getApSession()

    const rows = await query<Array<{ cession_id: number; status: string }>>(
      `SELECT cession_id, status
       FROM cession_agreements
       WHERE cession_id = ? AND buyer_id = ?
       LIMIT 1`,
      [cessionId, session.buyerId]
    )

    if (rows.length === 0) {
      return { success: false, error: "Cession agreement not found or access denied" }
    }
    if (rows[0].status !== "signed") {
      return {
        success: false,
        error: `Cannot reject — current status is "${rows[0].status}"`,
      }
    }

    await query(
      `UPDATE cession_agreements
       SET status = 'rejected', updated_at = NOW()
       WHERE cession_id = ?`,
      [cessionId]
    )

    await createAuditLog({
      userId: session.userId,
      userType: "accounts_payable",
      action: "BUYER_CESSION_REJECTED",
      entityType: "cession_agreement",
      entityId: cessionId,
      details: `AP user ${session.username} (buyer_id=${session.buyerId}) rejected cession #${cessionId}${
        reason ? `: ${reason}` : ""
      }`,
    })

    revalidatePath("/ap/cession-agreements")
    return { success: true }
  } catch (error: any) {
    console.error("[BuyerCession] rejectCessionAsBuyer error:", error)
    return { success: false, error: error.message || "Failed to reject cession agreement" }
  }
}
