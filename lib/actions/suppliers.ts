"use server"
// Handle cession agreement upload
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { uploadToBlobStorage, isBlobStorageConfigured } from "@/lib/services/blob-storage";

export async function uploadCessionAgreement({ supplierId, file, fileName }: { supplierId: number, file: Buffer, fileName: string }) {
  let documentUrl: string;

  // Use Azure Blob Storage in production, local filesystem for development
  if (isBlobStorageConfigured()) {
    // Upload to Azure Blob Storage (persistent)
    console.log(`[Cession] Uploading to Azure Blob Storage for supplier ${supplierId}`);
    documentUrl = await uploadToBlobStorage(file, fileName, supplierId);
    console.log(`[Cession] Uploaded to Blob Storage: ${documentUrl}`);
  } else {
    // Fallback to local filesystem (development only)
    console.log(`[Cession] Blob Storage not configured, using local filesystem`);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "cession-agreements");
    await fs.mkdir(uploadDir, { recursive: true });
    const uniqueName = `${supplierId}-${Date.now()}-${randomUUID()}-${fileName}`;
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, file);
    documentUrl = `/uploads/cession-agreements/${uniqueName}`;
  }

  // Insert or update cession_agreements record
  await query(
    `INSERT INTO cession_agreements (supplier_id, document_url, document_type, version, signed_date, status, created_at, updated_at)
     VALUES (?, ?, 'uploaded', 'v1', NOW(), 'pending', NOW(), NOW())
     ON DUPLICATE KEY UPDATE document_url = VALUES(document_url), document_type = 'uploaded', version = 'v1', signed_date = NOW(), status = 'pending', updated_at = NOW()`,
    [supplierId, documentUrl]
  );
  return { success: true, documentUrl };
}

// Check if supplier has signed/uploaded cession agreement
import type { CessionAgreement } from "@/lib/types/database"
// ...existing code...
export async function getSupplierCessionAgreement() {
  const session = await getSupplierSession()
  if (!session) {
    redirect("/supplier/access")
  }

  try {
    const agreements = await query<CessionAgreement[]>(
      `SELECT * FROM cession_agreements WHERE supplier_id = ? ORDER BY created_at DESC LIMIT 1`,
      [session.supplierId],
    )
    return agreements[0] || null
  } catch (error) {
    console.error("[v0] Error fetching supplier cession agreement:", error)
    throw error
  }
}
// Fetch supplier and buyer details for cession agreement PDF
export async function getSupplierAndBuyerDetails(supplierId: string) {
  // Get supplier details including company_code
  const supplierArr = await query(
    `SELECT supplier_id, name, physical_address, contact_email, contact_phone, company_code 
     FROM suppliers WHERE supplier_id = ? LIMIT 1`,
    [supplierId]
  );
  const supplier = supplierArr[0];
  if (!supplier) return null;
  
  // Get the correct buyer based on supplier's company_code
  const buyerArr = await query(
    `SELECT buyer_id, name, contact_email, contact_phone 
     FROM buyers 
     WHERE code = ? 
     LIMIT 1`,
    [supplier.company_code]
  );
  const buyer = buyerArr[0];
  if (!buyer) return null;
  return { supplier, buyer };
}

// ...existing code...


import { query, transaction } from "@/lib/db"
import { getSupplierSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { redirect } from "next/navigation"

// Get supplier offers
import type { PoolConnection } from "mysql2/promise"
export async function getSupplierOffers() {
  const session = await getSupplierSession()
  if (!session) {
    redirect("/supplier/access")
  }

  try {
    const offers = await query(
      `SELECT o.offer_id, o.annual_rate, o.days_to_maturity, o.discount_amount,
              o.net_payment_amount, o.offer_expiry_date, o.status, o.sent_at,
              i.invoice_number, i.invoice_date, i.due_date, i.amount as invoice_amount,
              i.currency, i.description,
              b.name as buyer_name, b.code as buyer_code
       FROM offers o
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       WHERE o.supplier_id = ?
       ORDER BY o.sent_at DESC`,
      [session.supplierId],
    )

    return offers
  } catch (error) {
    console.error("[v0] Error fetching supplier offers:", error)
    throw error
  }
}

// Get single supplier offer by ID
export async function getSupplierOfferById(offerId: number) {
  const session = await getSupplierSession()
  if (!session) {
    redirect("/supplier/access")
  }

  try {
    const offers = await query(
      `SELECT o.offer_id, o.annual_rate, o.days_to_maturity, o.discount_amount,
              o.net_payment_amount, o.offer_expiry_date, o.status, o.sent_at,
              i.invoice_number, i.invoice_date, i.due_date, i.amount as invoice_amount,
              i.currency, i.description,
              b.name as buyer_name, b.code as buyer_code
       FROM offers o
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       WHERE o.supplier_id = ? AND o.offer_id = ?`,
      [session.supplierId, offerId],
    )

    return offers[0] || null
  } catch (error) {
    console.error("[v0] Error fetching supplier offer:", error)
    throw error
  }
}

// Get supplier profile
export async function getSupplierProfile() {
  const session = await getSupplierSession()
  if (!session) {
    redirect("/supplier/access")
  }

  try {
    const suppliers = await query(
      `SELECT supplier_id, name, vat_no, registration_no, contact_person,
              contact_email, contact_phone, physical_address,
              bank_name, bank_account_no, bank_branch_code, bank_account_type,
              risk_tier, onboarding_status, active_status
       FROM suppliers
       WHERE supplier_id = ?`,
      [session.supplierId],
    )

    return suppliers[0] || null
  } catch (error) {
    console.error("[v0] Error fetching supplier profile:", error)
    throw error
  }
}

// Accept offer
export async function acceptOffer(offerId: number, selectedInvoices: number[]) {
  const session = await getSupplierSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  try {
    const result = await transaction(async (connection) => {
      // Verify offer belongs to supplier
      type OfferWithInvoice = {
        offer_expiry_date: string | Date
        invoice_id: number
        status: "sent" | "opened" | "accepted" | "rejected" | "expired"
      }
      const [rows] = await connection.execute(
        `SELECT o.*, i.invoice_id
         FROM offers o
         JOIN invoices i ON o.invoice_id = i.invoice_id
         WHERE o.offer_id = ? AND o.supplier_id = ?
         FOR UPDATE`,
        [offerId, session.supplierId],
      )
      const offersRows = rows as OfferWithInvoice[]

      if (!offersRows || offersRows.length === 0) {
        throw new Error("Offer not found or already processed")
      }

      const offer = offersRows[0];

      if (offer.status === "accepted") {
        return { success: true, offerId, alreadyAccepted: true }
      }

      if (offer.status !== "sent") {
        throw new Error(`Offer is already ${offer.status}`)
      }

      // Check if offer is expired
      if (new Date() > new Date(offer.offer_expiry_date)) {
  await connection.execute(`UPDATE offers SET status = 'expired' WHERE offer_id = ?`, [offerId])
        throw new Error("Offer has expired")
      }

      // Update offer status
  await connection.execute(`UPDATE offers SET status = 'accepted', responded_at = NOW() WHERE offer_id = ?`, [
        offerId,
      ])

      // Update invoice status
      await connection.execute(`UPDATE invoices SET status = 'accepted' WHERE invoice_id = ?`, [offer.invoice_id])

      return { success: true, offerId, alreadyAccepted: false, invoiceId: offer.invoice_id }
    })

    if (!result.alreadyAccepted) {
      await createAuditLog({
        userType: "supplier",
        action: "OFFER_ACCEPTED",
        entityType: "offer",
        entityId: offerId,
        details: `Supplier ${session.name} (ID ${session.supplierId}) accepted offer`,
      })

      // Create cession addendum for the accepted offer
      try {
        const { createCessionAddendum } = await import("@/lib/actions/standing-cession")
        const addendumResult = await createCessionAddendum([result.invoiceId], "offer_acceptance")
        
        if (!addendumResult.success) {
          console.warn("[Cession Addendum] Failed to create addendum:", addendumResult.error)
        }
      } catch (addendumError) {
        console.warn("[Cession Addendum] Error creating addendum:", addendumError)
      }
    }

    return result
  } catch (error) {
    console.error("[v0] Error accepting offer:", error)
    throw error
  }
}

// Reject offer
export async function rejectOffer(offerId: number) {
  const session = await getSupplierSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  try {
    const result = await transaction(async (connection) => {
      // Verify offer belongs to supplier
      type OfferWithInvoice = {
        offer_expiry_date: string | Date;
        invoice_id: number;
        // ...other fields as needed
      };
  const [rows] = await connection.execute(
        `SELECT o.*, i.invoice_id 
         FROM offers o
         JOIN invoices i ON o.invoice_id = i.invoice_id
         WHERE o.offer_id = ? AND o.supplier_id = ? AND o.status = 'sent'`,
        [offerId, session.supplierId],
      );
      const offersRows = rows as OfferWithInvoice[];

      if (!offersRows || offersRows.length === 0) {
        throw new Error("Offer not found or already processed")
      }

      const offer = offersRows[0];

      // Update offer status
  await connection.execute(`UPDATE offers SET status = 'rejected', responded_at = NOW() WHERE offer_id = ?`, [
        offerId,
      ])

      // Update invoice status back to matched
  await connection.execute(`UPDATE invoices SET status = 'matched' WHERE invoice_id = ?`, [offer.invoice_id])

      return { success: true, offerId }
    })

    await createAuditLog({
      userType: "supplier",
      action: "OFFER_REJECTED",
      entityType: "offer",
      entityId: offerId,
      details: `Supplier ${session.name} (ID ${session.supplierId}) rejected offer`,
    })

    return result
  } catch (error) {
    console.error("[v0] Error rejecting offer:", error)
    throw error
  }
}

// Accept multiple offers at once
export async function acceptMultipleOffers(offerIds: number[]) {
  const session = await getSupplierSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  if (!offerIds || offerIds.length === 0) {
    throw new Error("No offers selected")
  }

  try {
    const results = await transaction(async (connection) => {
      const successfulOffers: number[] = []
      const failedOffers: { offerId: number; reason: string }[] = []

      for (const offerId of offerIds) {
        try {
          // Verify offer belongs to supplier
          type OfferWithInvoice = {
            offer_expiry_date: string | Date
            invoice_id: number
            status: "sent" | "opened" | "accepted" | "rejected" | "expired"
          }
          const [rows] = await connection.execute(
            `SELECT o.*, i.invoice_id
             FROM offers o
             JOIN invoices i ON o.invoice_id = i.invoice_id
             WHERE o.offer_id = ? AND o.supplier_id = ?
             FOR UPDATE`,
            [offerId, session.supplierId],
          )
          const offersRows = rows as OfferWithInvoice[]

          if (!offersRows || offersRows.length === 0) {
            failedOffers.push({ offerId, reason: "Offer not found or already processed" })
            continue
          }

          const offer = offersRows[0]

          if (offer.status === "accepted") {
            successfulOffers.push(offerId) // Already accepted, count as success
            continue
          }

          if (offer.status !== "sent") {
            failedOffers.push({ offerId, reason: `Offer is already ${offer.status}` })
            continue
          }

          // Check if offer is expired
          if (new Date() > new Date(offer.offer_expiry_date)) {
            await connection.execute(`UPDATE offers SET status = 'expired' WHERE offer_id = ?`, [offerId])
            failedOffers.push({ offerId, reason: "Offer has expired" })
            continue
          }

          // Update offer status
          await connection.execute(`UPDATE offers SET status = 'accepted', responded_at = NOW() WHERE offer_id = ?`, [
            offerId,
          ])

          // Update invoice status
          await connection.execute(`UPDATE invoices SET status = 'accepted' WHERE invoice_id = ?`, [offer.invoice_id])

          successfulOffers.push(offerId)
        } catch (err: any) {
          failedOffers.push({ offerId, reason: err.message || "Unknown error" })
        }
      }

      return { successfulOffers, failedOffers }
    })

    // Log audit for each successful acceptance
    for (const offerId of results.successfulOffers) {
      await createAuditLog({
        userType: "supplier",
        action: "OFFER_ACCEPTED",
        entityType: "offer",
        entityId: offerId,
        details: `Supplier ${session.name} (ID ${session.supplierId}) accepted offer (batch)`,
      })
    }

    // Create cession addendum for accepted offers if any were successful
    if (results.successfulOffers.length > 0) {
      try {
        // Get invoice IDs for successful offers
        const invoiceQuery = await query<any[]>(
          `SELECT invoice_id FROM offers WHERE offer_id IN (?)`,
          [results.successfulOffers]
        )
        const invoiceIds = invoiceQuery.map((row: any) => row.invoice_id)
        
        if (invoiceIds.length > 0) {
          // Import and create addendum (dynamic import to avoid circular deps)
          const { createCessionAddendum } = await import("@/lib/actions/standing-cession")
          const addendumResult = await createCessionAddendum(invoiceIds, "offer_acceptance")
          
          if (!addendumResult.success) {
            console.warn("[Cession Addendum] Failed to create addendum:", addendumResult.error)
            // Don't fail the offer acceptance, just log the warning
          }
        }
      } catch (addendumError) {
        console.warn("[Cession Addendum] Error creating addendum:", addendumError)
        // Don't fail the offer acceptance, just log the warning
      }
    }

    return {
      success: true,
      acceptedCount: results.successfulOffers.length,
      failedCount: results.failedOffers.length,
      successfulOffers: results.successfulOffers,
      failedOffers: results.failedOffers,
    }
  } catch (error) {
    console.error("[v0] Error accepting multiple offers:", error)
    throw error
  }
}

// Get payment history
export async function getSupplierPayments() {
  const session = await getSupplierSession()
  if (!session) {
    redirect("/supplier/access")
  }

  try {
    const payments = await query(
      `SELECT p.payment_id, p.amount, p.currency, p.payment_reference,
              p.status, p.scheduled_date, p.completed_date,
              o.offer_id, o.discount_amount, o.net_payment_amount,
              i.invoice_number, i.amount as invoice_amount,
              b.name as buyer_name
       FROM payments p
       JOIN offers o ON p.offer_id = o.offer_id
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       WHERE p.supplier_id = ?
       ORDER BY p.created_at DESC`,
      [session.supplierId],
    )

    return payments
  } catch (error) {
    console.error("[v0] Error fetching supplier payments:", error)
    throw error
  }
}

// Update supplier profile
export async function updateSupplierProfile(data: {
  contactPerson?: string
  contactPhone?: string
  physicalAddress?: string
}) {
  const session = await getSupplierSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  try {
    const updates: string[] = []
    const values: any[] = []

    if (data.contactPerson !== undefined) {
      updates.push("contact_person = ?")
      values.push(data.contactPerson)
    }
    if (data.contactPhone !== undefined) {
      updates.push("contact_phone = ?")
      values.push(data.contactPhone)
    }
    if (data.physicalAddress !== undefined) {
      updates.push("physical_address = ?")
      values.push(data.physicalAddress)
    }

    if (updates.length === 0) {
      throw new Error("No updates provided")
    }

    values.push(session.supplierId)

    await query(`UPDATE suppliers SET ${updates.join(", ")} WHERE supplier_id = ?`, values)

    await createAuditLog({
      userType: "supplier",
      action: "PROFILE_UPDATED",
      entityType: "supplier",
      entityId: session.supplierId,
      details: "Supplier updated profile information",
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating supplier profile:", error)
    throw error
  }
}

// Request bank detail change
export async function requestBankChange(data: {
  newBankName: string
  newAccountNo: string
  newBranchCode: string
  newAccountType: "current" | "savings" | "business"
  reason: string
}) {
  const session = await getSupplierSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  try {
    // Get current bank details
    const supplier = await getSupplierProfile()

    await query(
      `INSERT INTO bank_change_requests 
       (supplier_id, old_bank_name, old_account_no, new_bank_name, new_account_no, 
        new_branch_code, new_account_type, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        session.supplierId,
        supplier.bank_name,
        supplier.bank_account_no,
        data.newBankName,
        data.newAccountNo,
        data.newBranchCode,
        data.newAccountType,
        data.reason,
      ],
    )

    await createAuditLog({
      userType: "supplier",
      action: "BANK_CHANGE_REQUESTED",
      entityType: "supplier",
      entityId: session.supplierId,
      details: `Requested bank change to ${data.newBankName}`,
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Error requesting bank change:", error)
    throw error
  }
}
