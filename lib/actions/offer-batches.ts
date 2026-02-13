"use server"

import { query, transaction } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import type { RowDataPacket } from "mysql2"
import { generateToken } from "@/lib/utils"
import { sendOfferNotificationEmail } from "@/lib/services/email"

// Types
export interface OfferBatch {
  batch_id: number
  supplier_id: number
  supplier_name: string
  supplier_email: string
  buyer_id: number
  buyer_name: string
  total_invoice_amount: number
  total_discount_amount: number
  total_net_payment: number
  invoice_count: number
  status: "draft" | "pending_review" | "sent" | "partial_accepted" | "accepted" | "expired" | "cancelled"
  send_mode: "auto" | "review" | "scheduled"
  scheduled_send_at: Date | null
  sent_at: Date | null
  expires_at: Date | null
  created_at: Date
}

export interface EligibleInvoiceGroup {
  supplier_id: number
  supplier_name: string
  supplier_email: string
  buyer_id: number
  buyer_name: string
  buyer_code: string
  invoice_count: number
  total_amount: number
  invoices: {
    invoice_id: number
    invoice_number: string
    amount: number
    due_date: Date
    days_to_maturity: number
  }[]
}

export interface BatchOffer {
  offer_id: number
  invoice_id: number
  invoice_number: string
  amount: number
  discount_amount: number
  net_payment_amount: number
  days_to_maturity: number
  status: string
}

// Get eligible invoices grouped by supplier for batch creation
export async function getEligibleInvoicesForBatching(): Promise<EligibleInvoiceGroup[]> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    // Get invoices that are matched and have approved suppliers
    const invoices = await query<RowDataPacket[]>(`
      SELECT 
        i.invoice_id, i.invoice_number, i.amount, i.due_date, i.company_code,
        s.supplier_id, s.name as supplier_name, s.contact_email as supplier_email,
        b.buyer_id, b.name as buyer_name, b.code as buyer_code,
        DATEDIFF(i.due_date, CURDATE()) as days_to_maturity
      FROM invoices i
      JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
      JOIN buyers b ON b.code = i.company_code
      WHERE i.status = 'matched' 
        AND s.onboarding_status = 'approved'
        AND DATEDIFF(i.due_date, CURDATE()) > 0
      ORDER BY s.supplier_id, i.due_date
    `)

    // Group by supplier
    const groupedMap = new Map<number, EligibleInvoiceGroup>()

    for (const inv of invoices) {
      const supplierId = inv.supplier_id

      if (!groupedMap.has(supplierId)) {
        groupedMap.set(supplierId, {
          supplier_id: supplierId,
          supplier_name: inv.supplier_name,
          supplier_email: inv.supplier_email,
          buyer_id: inv.buyer_id,
          buyer_name: inv.buyer_name,
          buyer_code: inv.buyer_code,
          invoice_count: 0,
          total_amount: 0,
          invoices: [],
        })
      }

      const group = groupedMap.get(supplierId)!
      group.invoice_count++
      group.total_amount += Number(inv.amount)
      group.invoices.push({
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        amount: Number(inv.amount),
        due_date: inv.due_date,
        days_to_maturity: inv.days_to_maturity,
      })
    }

    return Array.from(groupedMap.values())
  } catch (error) {
    console.error("[OfferBatches] Error getting eligible invoices:", error)
    throw error
  }
}

// Create an offer batch for a supplier
export async function createOfferBatch(
  supplierId: number,
  invoiceIds: number[],
  sendMode: "auto" | "review" | "scheduled" = "review",
  scheduledSendAt?: string | null  // Accept ISO string or null (not Date - better for serialization)
): Promise<{ batchId: number; offersCreated: number; errors: string[] }> {
  console.log("[OfferBatches] createOfferBatch called:", { supplierId, invoiceIds, sendMode, scheduledSendAt, typeOf: typeof scheduledSendAt })
  
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized - Admin access required")
  }

  if (invoiceIds.length === 0) {
    throw new Error("No invoices selected for batch")
  }

  // Normalize and validate scheduled date
  let normalizedScheduledSendAt: Date | null = null
  try {
    if (sendMode === "scheduled") {
      // Accept string ISO or null. Treat "$undefined"/empty as null.
      if (scheduledSendAt === null || scheduledSendAt === undefined) {
        normalizedScheduledSendAt = null
      } else if (typeof scheduledSendAt === "string") {
        const s = scheduledSendAt.trim()
        if (s === "" || s === "$undefined") {
          normalizedScheduledSendAt = null
        } else {
          const parsed = new Date(s)
          if (Number.isNaN(parsed.getTime())) {
            throw new Error("Invalid scheduled date format")
          }
          normalizedScheduledSendAt = parsed
        }
      } else {
        // Handle edge case of Date object being passed
        const parsed = new Date(scheduledSendAt as any)
        if (Number.isNaN(parsed.getTime())) {
          throw new Error("Invalid scheduled date format")
        }
        normalizedScheduledSendAt = parsed
      }

      if (!normalizedScheduledSendAt) {
        throw new Error("Scheduled send date required for 'scheduled' mode")
      }
    } else {
      // For non-scheduled modes, force null to avoid serialization pitfalls
      normalizedScheduledSendAt = null
    }
  } catch (e) {
    console.error("[OfferBatches] Scheduled date normalization error:", e)
    throw e
  }

  try {
    // Get system settings for offer calculation
    const settings = await query<RowDataPacket[]>(`
      SELECT setting_key, setting_value FROM system_settings 
      WHERE setting_key IN ('default_annual_rate', 'offer_expiry_days')
    `)

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.setting_key] = s.setting_value
      return acc
    }, {} as Record<string, string>)

    const annualRate = Number.parseFloat(settingsMap.default_annual_rate || "12.5")
    const expiryDays = Number.parseInt(settingsMap.offer_expiry_days || "7")

    return await transaction(async (connection) => {
      const errors: string[] = []
      let totalInvoiceAmount = 0
      let totalDiscountAmount = 0
      let totalNetPayment = 0
      let offersCreated = 0

      // Verify supplier exists and get buyer_id
      const [suppliers] = await connection.execute<RowDataPacket[]>(
        `SELECT s.supplier_id, s.name, s.contact_email, s.company_code, b.buyer_id, b.name as buyer_name
         FROM suppliers s
         JOIN buyers b ON b.code = s.company_code
         WHERE s.supplier_id = ? AND s.onboarding_status = 'approved'`,
        [supplierId]
      )

      if (suppliers.length === 0) {
        throw new Error("Supplier not found or not approved")
      }

      const supplier = suppliers[0]
      const buyerId = supplier.buyer_id

      // Calculate offer expiry
      const offerExpiryDate = new Date()
      offerExpiryDate.setDate(offerExpiryDate.getDate() + expiryDays)

      // Create the batch record
      const [batchResult] = await connection.execute(
        `INSERT INTO offer_batches 
         (supplier_id, buyer_id, invoice_count, status, send_mode, scheduled_send_at, expires_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          supplierId,
          buyerId,
          invoiceIds.length,
          sendMode === "auto" ? "sent" : "pending_review",
          sendMode,
          normalizedScheduledSendAt,
          offerExpiryDate,
          session.userId,
        ]
      )

      const batchId = (batchResult as any).insertId

      // Create offers for each invoice
      for (const invoiceId of invoiceIds) {
        try {
          // Get invoice details
          console.log(`[OfferBatches] Processing invoice ${invoiceId} for supplier ${supplierId}`)
          
          const [invoices] = await connection.execute<RowDataPacket[]>(
            `SELECT i.*, s.supplier_id
             FROM invoices i
             JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
             WHERE i.invoice_id = ? AND i.status = 'matched' AND s.supplier_id = ?`,
            [invoiceId, supplierId]
          )

          if (invoices.length === 0) {
            console.log(`[OfferBatches] Invoice ${invoiceId} not found or not eligible for supplier ${supplierId}`)
            errors.push(`Invoice ${invoiceId}: Not found or not eligible (may already be offered or wrong supplier)`)
            continue
          }

          const invoice = invoices[0]

          // Calculate offer details
          const dueDate = new Date(invoice.due_date)
          const today = new Date()
          const daysToMaturity = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysToMaturity <= 0) {
            errors.push(`Invoice ${invoiceId}: Already due or overdue`)
            continue
          }

          // Calculate discount on full invoice amount (80% paid immediately, 20% paid on due date)
          const invoiceAmount = Number(invoice.amount)
          const baseAmount = invoiceAmount
          const discountAmount = (baseAmount * annualRate * daysToMaturity) / (365 * 100)
          const netPaymentAmount = baseAmount - discountAmount

          // Create offer with batch_id
          // NOTE: The offers table enum only allows: 'sent','opened','accepted','rejected','expired'
          // For review mode, we use status='sent' but with sent_at=NULL to indicate "not yet sent to supplier"
          // The supplier portal filters by sent_at IS NOT NULL, so these won't be visible until the batch is actually sent
          await connection.execute(
            `INSERT INTO offers 
             (invoice_id, supplier_id, buyer_id, batch_id, annual_rate, days_to_maturity, 
              discount_amount, net_payment_amount, offer_expiry_date, status, sent_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?)`,
            [
              invoiceId,
              supplierId,
              buyerId,
              batchId,
              annualRate,
              daysToMaturity,
              discountAmount,
              netPaymentAmount,
              offerExpiryDate,
              sendMode === "auto" ? new Date() : null,
            ]
          )

          // Update invoice status
          await connection.execute(
            `UPDATE invoices SET status = 'offered' WHERE invoice_id = ?`,
            [invoiceId]
          )

          totalInvoiceAmount += invoiceAmount
          totalDiscountAmount += discountAmount
          totalNetPayment += netPaymentAmount
          offersCreated++
        } catch (error: any) {
          errors.push(`Invoice ${invoiceId}: ${error.message}`)
        }
      }

      // Update batch totals
      await connection.execute(
        `UPDATE offer_batches 
         SET total_invoice_amount = ?, total_discount_amount = ?, total_net_payment = ?, invoice_count = ?
         WHERE batch_id = ?`,
        [totalInvoiceAmount, totalDiscountAmount, totalNetPayment, offersCreated, batchId]
      )

      // If no offers were created, delete the batch and throw error
      if (offersCreated === 0) {
        await connection.execute(`DELETE FROM offer_batches WHERE batch_id = ?`, [batchId])
        const errorMsg = errors.length > 0 
          ? `No offers could be created. Errors: ${errors.join('; ')}` 
          : 'No eligible invoices found for this supplier'
        console.error(`[OfferBatches] ${errorMsg}`)
        throw new Error(errorMsg)
      }

      console.log(`[OfferBatches] Batch ${batchId} created: ${offersCreated} offers, R${totalNetPayment.toFixed(2)}`)

      // If auto-send, generate token and send email
      if (sendMode === "auto" && offersCreated > 0) {
        const token = generateToken()
        const tokenExpiry = new Date()
        tokenExpiry.setDate(tokenExpiry.getDate() + 14)

        // Generate short code (6 alphanumeric chars)
        const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase()

        await connection.execute(
          `INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at, short_code)
           VALUES (?, ?, 'offer_access', ?, ?)`,
          [supplierId, token, tokenExpiry, shortCode]
        )

        // Update batch to sent
        await connection.execute(
          `UPDATE offer_batches SET status = 'sent', sent_at = NOW() WHERE batch_id = ?`,
          [batchId]
        )

        // Send offer notification email
        const baseUrl = process.env.NEXTAUTH_URL || "https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net"
        const accessLink = `${baseUrl}/supplier/access?token=${token}`

        try {
          await sendOfferNotificationEmail(supplier.contact_email, supplier.name, accessLink, offersCreated, totalNetPayment)
        } catch (emailError) {
          console.error("[OfferBatches] Failed to send offer email:", emailError)
        }
      }

      // Create audit log
      await createAuditLog({
        userId: session.userId,
        userType: "admin",
        action: "OFFER_BATCH_CREATED",
        entityType: "offer_batch",
        entityId: batchId,
        details: `Created batch for ${supplier.name}: ${offersCreated} offers, R${totalNetPayment.toFixed(2)} total`,
      })

      return { batchId, offersCreated, errors }
    })
  } catch (error) {
    console.error("[OfferBatches] Error creating batch:", error)
    throw error
  }
}

// Get all offer batches
export async function getOfferBatches(): Promise<OfferBatch[]> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    const batches = await query<RowDataPacket[]>(`
      SELECT 
        ob.*,
        s.name as supplier_name, s.contact_email as supplier_email,
        b.name as buyer_name
      FROM offer_batches ob
      JOIN suppliers s ON ob.supplier_id = s.supplier_id
      JOIN buyers b ON ob.buyer_id = b.buyer_id
      ORDER BY ob.created_at DESC
    `)

    return batches as unknown as OfferBatch[]
  } catch (error) {
    console.error("[OfferBatches] Error fetching batches:", error)
    throw error
  }
}

// Get offers in a batch
export async function getBatchOffers(batchId: number): Promise<BatchOffer[]> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    const offers = await query<RowDataPacket[]>(`
      SELECT 
        o.offer_id, o.invoice_id, o.discount_amount, o.net_payment_amount, 
        o.days_to_maturity, o.status,
        i.invoice_number, i.amount
      FROM offers o
      JOIN invoices i ON o.invoice_id = i.invoice_id
      WHERE o.batch_id = ?
      ORDER BY i.invoice_number
    `, [batchId])

    return offers as unknown as BatchOffer[]
  } catch (error) {
    console.error("[OfferBatches] Error fetching batch offers:", error)
    throw error
  }
}

// Send a pending batch (for review mode)
export async function sendOfferBatch(batchId: number): Promise<{ success: boolean; message: string }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    return await transaction(async (connection) => {
      // Get batch details
      const [batches] = await connection.execute<RowDataPacket[]>(
        `SELECT ob.*, s.name as supplier_name, s.contact_email
         FROM offer_batches ob
         JOIN suppliers s ON ob.supplier_id = s.supplier_id
         WHERE ob.batch_id = ? AND ob.status = 'pending_review'`,
        [batchId]
      )

      if (batches.length === 0) {
        throw new Error("Batch not found or not in pending review status")
      }

      const batch = batches[0]

      // Update all offers in batch to sent
      await connection.execute(
        `UPDATE offers SET status = 'sent', sent_at = NOW() WHERE batch_id = ?`,
        [batchId]
      )

      // Update batch status
      await connection.execute(
        `UPDATE offer_batches SET status = 'sent', sent_at = NOW() WHERE batch_id = ?`,
        [batchId]
      )

      // Generate token and short code
      const token = generateToken()
      const tokenExpiry = new Date()
      tokenExpiry.setDate(tokenExpiry.getDate() + 14)
      const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      await connection.execute(
        `INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at, short_code)
         VALUES (?, ?, 'offer_access', ?, ?)`,
        [batch.supplier_id, token, tokenExpiry, shortCode]
      )

      // Send offer notification email
      const baseUrl = process.env.NEXTAUTH_URL || "https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net"
      const accessLink = `${baseUrl}/supplier/access?token=${token}`

      try {
        await sendOfferNotificationEmail(
          batch.contact_email,
          batch.supplier_name,
          accessLink,
          batch.invoice_count,
          Number(batch.total_net_payment || 0)
        )
      } catch (emailError) {
        console.error("[OfferBatches] Failed to send offer email:", emailError)
      }

      // Audit log
      await createAuditLog({
        userId: session.userId,
        userType: "admin",
        action: "OFFER_BATCH_SENT",
        entityType: "offer_batch",
        entityId: batchId,
        details: `Sent batch to ${batch.supplier_name}: ${batch.invoice_count} offers`,
      })

      return { success: true, message: `Batch sent to ${batch.supplier_name}` }
    })
  } catch (error: any) {
    console.error("[OfferBatches] Error sending batch:", error)
    throw error
  }
}

// Cancel a batch (removes offers, reverts invoices)
export async function cancelOfferBatch(batchId: number): Promise<{ success: boolean }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    return await transaction(async (connection) => {
      // Get batch
      const [batches] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM offer_batches WHERE batch_id = ? AND status IN ('draft', 'pending_review')`,
        [batchId]
      )

      if (batches.length === 0) {
        throw new Error("Batch not found or cannot be cancelled")
      }

      // Get invoice IDs from offers
      const [offers] = await connection.execute<RowDataPacket[]>(
        `SELECT invoice_id FROM offers WHERE batch_id = ?`,
        [batchId]
      )

      // Revert invoices to matched
      for (const offer of offers) {
        await connection.execute(
          `UPDATE invoices SET status = 'matched' WHERE invoice_id = ?`,
          [offer.invoice_id]
        )
      }

      // Delete offers
      await connection.execute(`DELETE FROM offers WHERE batch_id = ?`, [batchId])

      // Update batch status
      await connection.execute(
        `UPDATE offer_batches SET status = 'cancelled' WHERE batch_id = ?`,
        [batchId]
      )

      // Audit log
      await createAuditLog({
        userId: session.userId,
        userType: "admin",
        action: "OFFER_BATCH_CANCELLED",
        entityType: "offer_batch",
        entityId: batchId,
        details: `Cancelled batch with ${offers.length} offers`,
      })

      return { success: true }
    })
  } catch (error) {
    console.error("[OfferBatches] Error cancelling batch:", error)
    throw error
  }
}

// Exclude specific invoices from a pending batch
export async function excludeFromBatch(batchId: number, invoiceIds: number[]): Promise<{ success: boolean }> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    return await transaction(async (connection) => {
      // Verify batch is in pending_review
      const [batches] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM offer_batches WHERE batch_id = ? AND status = 'pending_review'`,
        [batchId]
      )

      if (batches.length === 0) {
        throw new Error("Batch not found or not in pending review status")
      }

      for (const invoiceId of invoiceIds) {
        // Delete the offer
        await connection.execute(
          `DELETE FROM offers WHERE batch_id = ? AND invoice_id = ?`,
          [batchId, invoiceId]
        )

        // Revert invoice to matched
        await connection.execute(
          `UPDATE invoices SET status = 'matched' WHERE invoice_id = ?`,
          [invoiceId]
        )
      }

      // Recalculate batch totals
      const [totals] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as invoice_count,
          COALESCE(SUM(i.amount), 0) as total_invoice_amount,
          COALESCE(SUM(o.discount_amount), 0) as total_discount_amount,
          COALESCE(SUM(o.net_payment_amount), 0) as total_net_payment
        FROM offers o
        JOIN invoices i ON o.invoice_id = i.invoice_id
        WHERE o.batch_id = ?
      `, [batchId])

      const newTotals = totals[0]

      await connection.execute(`
        UPDATE offer_batches 
        SET invoice_count = ?, total_invoice_amount = ?, 
            total_discount_amount = ?, total_net_payment = ?
        WHERE batch_id = ?
      `, [
        newTotals.invoice_count,
        newTotals.total_invoice_amount,
        newTotals.total_discount_amount,
        newTotals.total_net_payment,
        batchId
      ])

      return { success: true }
    })
  } catch (error) {
    console.error("[OfferBatches] Error excluding from batch:", error)
    throw error
  }
}
