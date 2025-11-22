"use server"

import { query, transaction } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { redirect } from "next/navigation"
import type { RowDataPacket } from "mysql2"

// Get payment queue (accepted offers ready for payment)
export async function getPaymentQueue() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const queue = await query(
      `SELECT o.offer_id, o.net_payment_amount, o.responded_at,
              i.invoice_number, i.invoice_id, i.currency,
              s.supplier_id, s.name as supplier_name, s.contact_email,
              s.bank_name, s.bank_account_no, s.bank_branch_code,
              b.name as buyer_name, b.buyer_id
       FROM offers o
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN suppliers s ON o.supplier_id = s.supplier_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       WHERE o.status = 'accepted' 
       AND NOT EXISTS (
         SELECT 1 FROM payments p WHERE p.offer_id = o.offer_id
       )
       ORDER BY o.responded_at ASC`,
    )

    return queue
  } catch (error) {
    console.error("[v0] Error fetching payment queue:", error)
    throw error
  }
}

// Get all payments
export async function getAllPayments() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const payments = await query(
      `SELECT p.payment_id, p.amount, p.currency, p.payment_reference,
              p.status, p.scheduled_date, p.completed_date, p.batch_id,
              s.name as supplier_name, s.contact_email,
              b.name as buyer_name,
              i.invoice_number
       FROM payments p
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       JOIN offers o ON p.offer_id = o.offer_id
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       ORDER BY p.created_at DESC
       LIMIT 100`,
    )

    return payments
  } catch (error) {
    console.error("[v0] Error fetching payments:", error)
    throw error
  }
}

// Queue payments for processing
export async function queuePayments(offerIds: number[]) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    const results = await transaction(async (connection) => {
      const queued = []
      const errors = []

      for (const offerId of offerIds) {
        try {
          // Get offer details
          const [offerRows] = await connection.execute<RowDataPacket[]>(
            `SELECT o.*, s.supplier_id, s.bank_account_no, i.invoice_id, i.due_date
             FROM offers o
             JOIN suppliers s ON o.supplier_id = s.supplier_id
             JOIN invoices i ON o.invoice_id = i.invoice_id
             WHERE o.offer_id = ? AND o.status = 'accepted'`,
            [offerId],
          )

          if (offerRows.length === 0) {
            errors.push(`Offer ${offerId}: Not found or not accepted`)
            continue
          }

          const offer = offerRows[0] as any

          // Check if payment already exists
          const [existingPayments] = await connection.execute<RowDataPacket[]>(
            `SELECT payment_id FROM payments WHERE offer_id = ?`,
            [offerId],
          )

          if (existingPayments.length > 0) {
            errors.push(`Offer ${offerId}: Payment already exists`)
            continue
          }

          // Generate payment reference
          const paymentRef = `FMF${Date.now()}${offerId}`

          // Create payment record
          await connection.execute(
            `INSERT INTO payments (offer_id, supplier_id, amount, currency, 
             payment_reference, status, scheduled_date, processed_by)
             VALUES (?, ?, ?, ?, ?, 'queued', CURDATE(), ?)`,
            [offerId, offer.supplier_id, offer.net_payment_amount, "ZAR", paymentRef, session.userId],
          )

          // Create repayment record
          await connection.execute(
            `INSERT INTO repayments (payment_id, buyer_id, expected_amount, due_date, status)
             SELECT LAST_INSERT_ID(), ?, ?, ?, 'pending'`,
            [offer.buyer_id, offer.net_payment_amount + offer.discount_amount, offer.due_date],
          )

          queued.push(offerId)
        } catch (error: any) {
          errors.push(`Offer ${offerId}: ${error.message}`)
        }
      }

      return { queued, errors }
    })

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "PAYMENTS_QUEUED",
      details: `Queued ${results.queued.length} payments, ${results.errors.length} errors`,
    })

    return results
  } catch (error) {
    console.error("[v0] Error queueing payments:", error)
    throw error
  }
}

// Generate payment batch CSV
export async function generatePaymentBatch(paymentIds: number[]) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    const batchId = `BATCH${Date.now()}`

    const results = await transaction(async (connection) => {
      const payments = []

      for (const paymentId of paymentIds) {
        // Get payment details
          const [paymentData] = await connection.execute<RowDataPacket[]>(
          `SELECT p.payment_id, p.amount, p.payment_reference,
                  s.name as supplier_name, s.bank_name, s.bank_account_no, 
                  s.bank_branch_code, s.bank_account_type
           FROM payments p
           JOIN suppliers s ON p.supplier_id = s.supplier_id
           WHERE p.payment_id = ? AND p.status = 'queued'`,
          [paymentId],
        )

        if (paymentData.length > 0) {
          payments.push(paymentData[0])

          // Update payment status and batch ID
          await connection.execute(`UPDATE payments SET status = 'processing', batch_id = ? WHERE payment_id = ?`, [
            batchId,
            paymentId,
          ])
        }
      }

      return { batchId, payments }
    })

    // Generate CSV content
    const csvHeaders = [
      "Payment Reference",
      "Beneficiary Name",
      "Bank Name",
      "Account Number",
      "Branch Code",
      "Account Type",
      "Amount",
    ]

    const csvRows = results.payments.map((p: any) => [
      p.payment_reference,
      p.supplier_name,
      p.bank_name,
      p.bank_account_no,
      p.bank_branch_code,
      p.bank_account_type,
      p.amount.toFixed(2),
    ])

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n")

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "PAYMENT_BATCH_GENERATED",
      details: `Generated batch ${batchId} with ${results.payments.length} payments`,
    })

    return {
      batchId: results.batchId,
      csvContent,
      paymentCount: results.payments.length,
    }
  } catch (error) {
    console.error("[v0] Error generating payment batch:", error)
    throw error
  }
}

// Mark payments as completed
export async function markPaymentsCompleted(paymentIds: number[]) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    await transaction(async (connection) => {
      for (const paymentId of paymentIds) {
        await connection.execute(
          `UPDATE payments SET status = 'completed', completed_date = CURDATE() WHERE payment_id = ?`,
          [paymentId],
        )

        // Update invoice status
        await connection.execute(
          `UPDATE invoices i
           JOIN offers o ON i.invoice_id = o.invoice_id
           JOIN payments p ON o.offer_id = p.offer_id
           SET i.status = 'paid'
           WHERE p.payment_id = ?`,
          [paymentId],
        )
      }
    })

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "PAYMENTS_COMPLETED",
      details: `Marked ${paymentIds.length} payments as completed`,
    })

    return { success: true, count: paymentIds.length }
  } catch (error) {
    console.error("[v0] Error marking payments completed:", error)
    throw error
  }
}

// Get repayments
export async function getRepayments() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const repayments = await query(
      `SELECT r.repayment_id, r.expected_amount, r.received_amount, r.due_date,
              r.received_date, r.status, r.reconciliation_reference,
              b.name as buyer_name, b.code as buyer_code,
              p.payment_reference, p.amount as payment_amount,
              s.name as supplier_name,
              i.invoice_number
       FROM repayments r
       JOIN buyers b ON r.buyer_id = b.buyer_id
       JOIN payments p ON r.payment_id = p.payment_id
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       JOIN offers o ON p.offer_id = o.offer_id
       JOIN invoices i ON o.invoice_id = i.invoice_id
       ORDER BY r.due_date ASC`,
    )

    return repayments
  } catch (error) {
    console.error("[v0] Error fetching repayments:", error)
    throw error
  }
}

// Record repayment
export async function recordRepayment(repaymentId: number, amount: number, reference: string) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    await transaction(async (connection) => {
      // Get current repayment
      const [repayments] = await connection.execute<RowDataPacket[]>(
        `SELECT expected_amount, received_amount FROM repayments WHERE repayment_id = ?`,
        [repaymentId],
      )

      if (repayments.length === 0) {
        throw new Error("Repayment not found")
      }

      const repayment = repayments[0]
      const newReceivedAmount = (repayment.received_amount || 0) + amount
      const expectedAmount = repayment.expected_amount

      let status = "partial"
      if (newReceivedAmount >= expectedAmount) {
        status = "completed"
      }

      await connection.execute(
        `UPDATE repayments 
         SET received_amount = ?, received_date = CURDATE(), status = ?, 
             reconciliation_reference = ?
         WHERE repayment_id = ?`,
        [newReceivedAmount, status, reference, repaymentId],
      )
    })

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "REPAYMENT_RECORDED",
      entityType: "repayment",
      entityId: repaymentId,
      details: `Recorded repayment of R${amount}`,
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Error recording repayment:", error)
    throw error
  }
}
