// lib/actions/invoices.ts
"use server"

import { query, transaction } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { sendSupplierWelcomeEmail } from "@/lib/services/email"
import type { RowDataPacket, OkPacket } from "mysql2"
import { generateToken } from "@/lib/utils"
import type { APDataRow, VendorDataRow } from "@/lib/types/database"
import { redirect } from "next/navigation"

type OfferGenerationResults = {
  created: Array<{ invoiceId: number; invoiceNumber: string | null; supplierEmail: string | null; token: string }>
  errors: string[]
}

// Parse AP invoice CSV text into APDataRow[]
export async function parseAPDataCSV(csvText: string): Promise<APDataRow[]> {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid")
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows: APDataRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values: string[] = []
    let currentValue = ""
    let insideQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ""
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    if (values.length < headers.length) continue

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })

    rows.push(row as APDataRow)
  }

  return rows
}

// Parse vendor CSV text into VendorDataRow[]
export async function parseVendorDataCSV(csvText: string): Promise<VendorDataRow[]> {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid")
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows: VendorDataRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values: string[] = []
    let currentValue = ""
    let insideQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ""
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    if (values.length < headers.length) continue

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })

    rows.push(row as VendorDataRow)
  }

  return rows
}


function toNullable(value: any): any {
  if (value === undefined || value === null || value === "") {
    return null
  }
  return value
}

async function ensureBuyerForCompany(connection: any, companyCode: string | null): Promise<number | null> {
  if (!companyCode) {
    return null
  }

  const [existing] = await connection.execute(`SELECT buyer_id FROM buyers WHERE code = ? LIMIT 1`, [companyCode])
  const rows = existing as RowDataPacket[]

  if (rows.length > 0) {
    return rows[0].buyer_id
  }

  const [result] = await connection.execute(
    `INSERT INTO buyers (name, code, contact_email, active_status)
     VALUES (?, ?, ?, 'active')`,
    [`Company ${companyCode}`, companyCode, `${companyCode}@placeholder.local`],
  )

  const insertResult = result as OkPacket
  return insertResult.insertId ?? null
}

async function getSupplierIdByVendorNumber(connection: any, vendorNumber: string | null, companyCode: string | null): Promise<number | null> {
  if (!vendorNumber) {
    return null
  }

  const [existing] = await connection.execute(
    `SELECT supplier_id FROM suppliers WHERE vendor_number = ? AND (company_code = ? OR company_code IS NULL) LIMIT 1`,
    [vendorNumber, companyCode]
  )
  const rows = existing as RowDataPacket[]

  if (rows.length > 0) {
    return rows[0].supplier_id
  }

  return null
}

export async function uploadAPData(apDataRows: APDataRow[]) {
  // Updated mapping from APDataRow (CSV) to new invoices table columns (without supplier_id and buyer_id):
  // CSV fields: Company Code, Vendor Number, Vendor Name, Document Number, Document Type, Document Date, Posting Date, Baseline Date, Net Due Date, Days Overdue, Amount (Doc Curr), Currency, Amount (Local Curr), Payment Terms, Payment Method, Assignment (PO #), Reference (Invoice #), Open Item, Text
  // Table columns: invoice_id, company_code, vendor_number, invoice_number, invoice_date, due_date, amount, currency, description, status, uploaded_by, uploaded_at, updated_at, document_number, document_type, document_date, posting_date, baseline_date, net_due_date, days_overdue, amount_doc_curr, amount_local_curr, payment_terms, payment_method, assignment_po, reference_invoice, open_item, text_description
  // Mapping:
  // company_code: Company Code
  // vendor_number: Vendor Number
  // invoice_number: Reference (Invoice #) or Document Number
  // invoice_date: Document Date
  // due_date: Net Due Date
  // amount: Amount (Doc Curr)
  // currency: Currency
  // description: row.Text (or blank)
  // status: 'matched'
  // uploaded_by: session.userId
  // uploaded_at: NOW()
  // updated_at: NOW()
  // document_number: Document Number
  // document_type: Document Type
  // document_date: Document Date
  // posting_date: Posting Date
  // baseline_date: Baseline Date
  // net_due_date: Net Due Date
  // days_overdue: Days Overdue
  // amount_doc_curr: Amount (Doc Curr)
  // amount_local_curr: Amount (Local Curr)
  // payment_terms: Payment Terms
  // payment_method: Payment Method
  // assignment_po: Assignment (PO #)
  // reference_invoice: Reference (Invoice #)
  // open_item: Open Item
  // text_description: Text

  const session = await getSession()
  if (!session || session.role !== "accounts_payable") {
    throw new Error("Unauthorized")
  }

  // Get the buyer code for the logged-in AP user to validate uploads
  let allowedBuyerCode: string | null = null
  if (session.buyerId) {
    const buyers = await query<Array<{ code: string }>>(
      `SELECT code FROM buyers WHERE buyer_id = ?`,
      [session.buyerId]
    )
    if (buyers.length > 0) {
      allowedBuyerCode = buyers[0].code
    }
  }

  try {
    const results = await transaction(async (connection) => {
      const uploaded = []
      const errors = []

      for (const originalRow of apDataRows) {
        try {
          const row = { ...originalRow };

          // Only process open items
          if (row["Open Item"]?.toLowerCase() !== "yes") {
            continue
          }

          // Validate that AP user can only upload for their own buyer
          let rowCompanyCode = row["Company Code"]
          // Auto-fill missing company code with the AP user's buyer code to reduce template errors.
          if (allowedBuyerCode && (!rowCompanyCode || rowCompanyCode.trim() === "")) {
            rowCompanyCode = allowedBuyerCode;
            row["Company Code"] = allowedBuyerCode;
          }

          if (allowedBuyerCode && rowCompanyCode && rowCompanyCode !== allowedBuyerCode) {
            errors.push(`${row["Document Number"]}: You can only upload invoices for your company (${allowedBuyerCode}), not ${rowCompanyCode}`)
            continue
          }

          // Get buyer_id from Company Code (use session's buyer_id if available)
          let buyerId: number | null = session.buyerId || null
          if (!buyerId) {
            buyerId = await ensureBuyerForCompany(connection, row["Company Code"])
          }
          if (!buyerId) {
            errors.push(`${row["Document Number"]}: Could not resolve buyer for company code ${row["Company Code"]}`)
            continue
          }

          // Get supplier_id from Vendor Number
          const supplierId = await getSupplierIdByVendorNumber(connection, row["Vendor Number"], row["Company Code"])
          if (!supplierId) {
            errors.push(`${row["Document Number"]}: Supplier not found for vendor number ${row["Vendor Number"]}. Please upload vendor data first.`)
            continue
          }

          const amountDocCurr = row["Amount (Doc Curr)"]
            ? Number.parseFloat(row["Amount (Doc Curr)"].replace(/,/g, ""))
            : 0
          const amountLocalCurr = row["Amount (Local Curr)"]
            ? Number.parseFloat(row["Amount (Local Curr)"].replace(/,/g, ""))
            : 0
          const daysOverdue = row["Days Overdue"] ? Number.parseInt(row["Days Overdue"]) : 0

          const documentDate = toNullable(row["Document Date"])
          const postingDate = toNullable(row["Posting Date"])
          const baselineDate = toNullable(row["Baseline Date"])
          const netDueDate = toNullable(row["Net Due Date"])

          await connection.execute(
            `INSERT INTO invoices (
              buyer_id, supplier_id, company_code, vendor_number, invoice_number, invoice_date, due_date, amount, currency,
              description, status, uploaded_by, uploaded_at, updated_at,
              document_number, document_type, document_date,
              posting_date, baseline_date, net_due_date, days_overdue, amount_doc_curr,
              amount_local_curr, payment_terms, payment_method, assignment_po, reference_invoice,
              open_item, text_description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              buyerId, // 1. buyer_id
              supplierId, // 2. supplier_id
              toNullable(row["Company Code"]), // 3. company_code
              toNullable(row["Vendor Number"]), // 4. vendor_number
              toNullable(row["Reference (Invoice #)"]) || toNullable(row["Document Number"]), // 5. invoice_number
              documentDate, // 6. invoice_date
              netDueDate, // 7. due_date
              amountDocCurr, // 8. amount
              toNullable(row["Currency"]) || "ZAR", // 9. currency
              toNullable(row["Text"]), // 10. description
              "matched", // 11. status
              session.userId, // 12. uploaded_by
              // 13. uploaded_at (NOW())
              // 14. updated_at (NOW())
              toNullable(row["Document Number"]), // 15. document_number
              toNullable(row["Document Type"]), // 16. document_type
              documentDate, // 17. document_date
              postingDate, // 18. posting_date
              baselineDate, // 19. baseline_date
              netDueDate, // 20. net_due_date
              daysOverdue, // 21. days_overdue
              amountDocCurr, // 22. amount_doc_curr
              amountLocalCurr, // 23. amount_local_curr
              toNullable(row["Payment Terms"]), // 24. payment_terms
              toNullable(row["Payment Method"]), // 25. payment_method
              toNullable(row["Assignment (PO #)"]), // 26. assignment_po
              toNullable(row["Reference (Invoice #)"]), // 27. reference_invoice
              toNullable(row["Open Item"]), // 28. open_item
              toNullable(row["Text"]), // 29. text_description
            ],
          )

          uploaded.push(row["Document Number"])
        } catch (error: any) {
          if (error.code === "ER_DUP_ENTRY") {
            errors.push(`${row["Document Number"]}: Duplicate invoice`)
          } else {
            errors.push(`${row["Document Number"]}: ${error.message}`)
          }
        }
      }

      return { uploaded, errors }
    })

    await createAuditLog({
      userId: session.userId,
      userType: "accounts_payable",
      action: "AP_DATA_UPLOADED",
      details: `Uploaded ${results.uploaded.length} invoices, ${results.errors.length} errors`,
    })

    // Automatically generate offers for any invoices that became eligible after this upload
    await autoGenerateOffersForEligibleInvoices("ap_upload")

    return results
  } catch (error) {
    console.error("[v0] Error uploading AP data:", error)
    throw error
  }
}

export async function uploadVendorData(vendorDataRows: VendorDataRow[]) {
  const session = await getSession()
  if (!session || (session.role !== "admin" && session.role !== "accounts_payable")) {
    throw new Error("Unauthorized - Admin or AP access required")
  }

  try {
    // Get the buyer code for the logged-in AP user (for validation)
    let allowedBuyerCode: string | null = null
    if (session.buyerId) {
      const buyers = await query<Array<{ code: string }>>(`SELECT code FROM buyers WHERE buyer_id = ?`, [session.buyerId])
      if (buyers.length > 0) {
        allowedBuyerCode = buyers[0].code
      }
    }

    const results = await transaction(async (connection) => {
      const uploaded = []
      const errors = []
      const newSuppliers = []

      for (const originalRow of vendorDataRows) {
        try {
          const row = { ...originalRow };

          // Validate that AP users only upload vendors for their company
          let rowCompanyCode = row["Company Code"]
          // Auto-fill missing company code with the AP user's buyer code for convenience.
          if (allowedBuyerCode && (!rowCompanyCode || rowCompanyCode.trim() === "")) {
            rowCompanyCode = allowedBuyerCode;
            row["Company Code"] = allowedBuyerCode;
          }

          if (allowedBuyerCode && rowCompanyCode && rowCompanyCode !== allowedBuyerCode) {
            errors.push(`${row["Vendor Number"]}: You can only upload vendors for your company (${allowedBuyerCode}), not ${rowCompanyCode}`)
            continue
          }

          // Check if supplier exists
          const [existing] = await connection.execute(
            "SELECT supplier_id FROM suppliers WHERE vendor_number = ? AND company_code = ?",
            [row["Vendor Number"], row["Company Code"]],
          )

          const existingRows = existing as RowDataPacket[]

          let supplierId: number | null = null;
          let isNewSupplier = false;
          
          if (existingRows.length > 0) {
            // Existing supplier - update their details
            supplierId = existingRows[0].supplier_id;
            await connection.execute(
              `UPDATE suppliers SET
                name = ?, address = ?, contact_person = ?, contact_email = ?, contact_phone = ?,
                bank_country = ?, bank_name = ?, bank_key_branch_code = ?, bank_account_no = ?,
                iban = ?, swift_bic = ?, default_payment_method = ?, default_payment_terms = ?,
                vat_no = ?, reconciliation_gl_account = ?
              WHERE supplier_id = ?`,
              [
                row["Vendor Name"],
                toNullable(row["Address"]),
                toNullable(row["Contact Person"]),
                row["Contact Email"],
                toNullable(row["Contact Phone"]),
                toNullable(row["Bank Country"]),
                toNullable(row["Bank Name"]),
                toNullable(row["Bank Key (Branch Code)"]),
                toNullable(row["Bank Account Number"]),
                toNullable(row["IBAN"]),
                toNullable(row["SWIFT/BIC"]),
                toNullable(row["Default Payment Method"]),
                toNullable(row["Default Payment Terms"]),
                toNullable(row["VAT Registration No"]),
                toNullable(row["Reconciliation G/L Account"]),
                supplierId,
              ],
            );
            uploaded.push(row["Vendor Number"]);
          } else {
            // New supplier - insert into database
            const [result] = await connection.execute(
              `INSERT INTO suppliers (
                vendor_number, company_code, name, address, contact_person, contact_email, contact_phone,
                bank_country, bank_name, bank_key_branch_code, bank_account_no, iban, swift_bic,
                default_payment_method, default_payment_terms, vat_no, reconciliation_gl_account,
                onboarding_status, active_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'active')`,
              [
                row["Vendor Number"],
                row["Company Code"],
                row["Vendor Name"],
                toNullable(row["Address"]),
                toNullable(row["Contact Person"]),
                row["Contact Email"],
                toNullable(row["Contact Phone"]),
                toNullable(row["Bank Country"]),
                toNullable(row["Bank Name"]),
                toNullable(row["Bank Key (Branch Code)"]),
                toNullable(row["Bank Account Number"]),
                toNullable(row["IBAN"]),
                toNullable(row["SWIFT/BIC"]),
                toNullable(row["Default Payment Method"]),
                toNullable(row["Default Payment Terms"]),
                toNullable(row["VAT Registration No"]),
                toNullable(row["Reconciliation G/L Account"]),
              ],
            );
            const insertResult = result as OkPacket;
            supplierId = insertResult.insertId;
            isNewSupplier = true;
            uploaded.push(row["Vendor Number"]);
          }
          
          // Only create tokens for NEW suppliers (not updates to existing ones)
          if (supplierId && isNewSupplier && row["Contact Email"]) {
            newSuppliers.push({
              supplierId,
              email: row["Contact Email"],
              name: row["Vendor Name"],
            });
          }
        } catch (error: any) {
          errors.push(`${row["Vendor Number"]}: ${error.message}`)
        }
      }

      return { uploaded, errors, newSuppliers }
    })

    // Create tokens and send invitation emails for new suppliers
    console.log(`[v0] Processing ${results.newSuppliers.length} new suppliers for token creation and email invitations`)
    
    for (const supplier of results.newSuppliers) {
      try {
        // Check if supplier already has an active (unused, non-expired) token
        const existingTokens = await query<RowDataPacket[]>(
          `SELECT token_id FROM supplier_tokens 
           WHERE supplier_id = ? AND token_type = 'invite' AND used_at IS NULL AND expires_at > NOW()`,
          [supplier.supplierId]
        )
        
        if (existingTokens.length > 0) {
          console.log(`[v0] Supplier ${supplier.supplierId} already has an active invite token, skipping`)
          continue
        }
        
        const token = generateToken()
        const tokenExpiry = new Date()
        tokenExpiry.setDate(tokenExpiry.getDate() + 14)

        await query(
          `INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at)
           VALUES (?, ?, 'invite', ?)`,
          [supplier.supplierId, token, tokenExpiry],
        )
        
        console.log(`[v0] Created invite token for supplier ${supplier.supplierId} (${supplier.email})`)

        // Generate access link with token - use the correct Azure URL
        const baseUrl = process.env.NEXTAUTH_URL || "https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net"
        const accessLink = `${baseUrl}/supplier/access?token=${token}`

        // Send invitation email via Azure Communication Services
        console.log(`[v0] Sending invitation email to ${supplier.email} with access link: ${accessLink}`)
        
        const emailSent = await sendSupplierWelcomeEmail(
          supplier.email,
          supplier.name,
          accessLink
        )

        if (emailSent) {
          console.log(`[v0] Invitation email sent successfully to ${supplier.email}`)
        } else {
          console.error(`[v0] Failed to send invitation email to ${supplier.email} - email service returned false`)
        }
      } catch (error) {
        console.error(`[v0] Failed to create invitation for supplier ${supplier.supplierId}:`, error)
      }
    }

    await createAuditLog({
      userId: session.userId,
      userType: session.role,
      action: "VENDOR_DATA_UPLOADED",
      details: `Uploaded ${results.uploaded.length} vendors (${results.newSuppliers.length} new), ${results.errors.length} errors`,
    })

    return results
  } catch (error) {
    console.error("[v0] Error uploading vendor data:", error)
    throw error
  }
}

// Get invoices for AP user - UPDATED to filter by buyer_id
export async function getInvoicesForBuyer() {
  const session = await getSession()
  if (!session || session.role !== "accounts_payable") {
    redirect("/login/ap")
  }

  // Get buyer code from buyer_id
  const buyers = await query<Array<{ code: string }>>(
    `SELECT code FROM buyers WHERE buyer_id = ?`,
    [session.buyerId]
  )
  
  if (buyers.length === 0) {
    console.error("[v0] No buyer found for buyerId:", session.buyerId)
    return []
  }
  
  const buyerCode = buyers[0].code

  try {
    const invoices = await query(
      `SELECT i.invoice_id, i.document_number, i.reference_invoice, i.document_date, 
        CAST(i.due_date AS CHAR) as due_date, i.amount_local_curr, i.net_due_date, i.amount_doc_curr, i.currency, i.text_description, i.status, 
        i.uploaded_at, i.payment_terms, i.vendor_number, i.company_code,
        s.name as supplier_name,
        COUNT(o.offer_id) as offer_count
       FROM invoices i
       LEFT JOIN offers o ON i.invoice_id = o.invoice_id
       LEFT JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
       WHERE i.buyer_id = ?
       GROUP BY i.invoice_id
       ORDER BY i.uploaded_at DESC`,
      [session.buyerId]
    )

    return invoices
  } catch (error) {
    console.error("[v0] Error fetching invoices:", error)
    throw error
  }
}

// Get invoices based on user session - for API use
export async function getInvoicesForSession() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  try {
    // Admin sees all invoices
    if (session.role === "admin") {
      const invoices = await query(
        `SELECT i.invoice_id, i.document_number, i.reference_invoice, i.document_date, 
          i.due_date, i.amount, i.currency, i.status, i.uploaded_at,
          i.vendor_number, i.payment_terms, i.company_code, i.amount_doc_curr, i.amount_local_curr,
          s.name as supplier_name,
          b.name as buyer_name,
          COUNT(o.offer_id) as offer_count
         FROM invoices i
         LEFT JOIN offers o ON i.invoice_id = o.invoice_id
         LEFT JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
         LEFT JOIN buyers b ON i.buyer_id = b.buyer_id
         GROUP BY i.invoice_id
         ORDER BY i.uploaded_at DESC
         LIMIT 100`,
      )
      return invoices
    }

    // AP user sees only their buyer's invoices
    if (session.role === "accounts_payable" && session.buyerId) {
      const invoices = await query(
        `SELECT i.invoice_id, i.document_number, i.reference_invoice, i.document_date, 
          CAST(i.due_date AS CHAR) as due_date, i.amount_local_curr, i.net_due_date, i.amount_doc_curr, i.currency, i.text_description, i.status, 
          i.uploaded_at, i.payment_terms, i.vendor_number, i.company_code,
          s.name as supplier_name,
          COUNT(o.offer_id) as offer_count
         FROM invoices i
         LEFT JOIN offers o ON i.invoice_id = o.invoice_id
         LEFT JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
         WHERE i.buyer_id = ?
         GROUP BY i.invoice_id
         ORDER BY i.uploaded_at DESC`,
        [session.buyerId]
      )
      return invoices
    }

    // Fallback - empty result
    return []
  } catch (error) {
    console.error("[v0] Error fetching invoices for session:", error)
    throw error
  }
}

// Internal helper to build offers for a list of invoice IDs
async function createOffersForInvoices(invoiceIds: number[]): Promise<OfferGenerationResults> {
  const uniqueInvoiceIds = [...new Set(invoiceIds)].filter((id) => typeof id === "number" && !Number.isNaN(id))
  if (uniqueInvoiceIds.length === 0) {
    return { created: [], errors: [] }
  }

  // Get system settings
  const settings = await query<RowDataPacket[]>(
    `SELECT setting_key, setting_value FROM system_settings 
     WHERE setting_key IN ('default_annual_rate', 'offer_expiry_days')`,
  )

  const settingsMap = settings.reduce(
    (acc, s) => {
      acc[s.setting_key] = s.setting_value
      return acc
    },
    {} as Record<string, string>,
  )

  const annualRate = Number.parseFloat(settingsMap.default_annual_rate || "12.5")
  const expiryDays = Number.parseInt(settingsMap.offer_expiry_days || "7")

  return transaction(async (connection) => {
    const created: OfferGenerationResults["created"] = []
    const errors: string[] = []

    for (const invoiceId of uniqueInvoiceIds) {
      try {
        // Get invoice details
        const [invoices] = await connection.execute(
          `SELECT i.*, s.supplier_id, s.contact_email, s.onboarding_status, b.buyer_id
           FROM invoices i
           JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
           LEFT JOIN buyers b ON b.code = i.company_code
           WHERE i.invoice_id = ? AND i.status = 'matched'`,
          [invoiceId],
        )

        const invoiceRows = invoices as RowDataPacket[]

        if (invoiceRows.length === 0) {
          errors.push(`Invoice ${invoiceId}: Not found or not eligible`)
          continue
        }

        const invoice = invoiceRows[0]

        // Check if supplier is approved
        if (invoice.onboarding_status !== "approved") {
          errors.push(`Invoice ${invoiceId}: Supplier not approved`)
          continue
        }

        // Calculate offer details
        const dueDate = new Date(invoice.due_date)
        const today = new Date()
        const daysToMaturity = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysToMaturity <= 0) {
          errors.push(`Invoice ${invoiceId}: Already due or overdue`)
          continue
        }

        const discountAmount = (invoice.amount * annualRate * daysToMaturity) / (365 * 100)
        const netPaymentAmount = invoice.amount - discountAmount

        const offerExpiryDate = new Date()
        offerExpiryDate.setDate(offerExpiryDate.getDate() + expiryDays)

        let buyerId = invoice.buyer_id as number | null
        if (!buyerId) {
          buyerId = await ensureBuyerForCompany(connection, invoice.company_code)
        }

        if (!buyerId) {
          errors.push(`Invoice ${invoiceId}: Unable to resolve buyer for company code ${invoice.company_code}`)
          continue
        }

        // Create offer record referencing resolved supplier/buyer ids
        await connection.execute(
          `INSERT INTO offers (invoice_id, supplier_id, buyer_id, annual_rate,
           days_to_maturity, discount_amount, net_payment_amount, offer_expiry_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent')`,
          [
            invoiceId,
            invoice.supplier_id,
            buyerId,
            annualRate,
            daysToMaturity,
            discountAmount,
            netPaymentAmount,
            offerExpiryDate,
          ],
        )

        // Update invoice status
        await connection.execute(`UPDATE invoices SET status = 'offered' WHERE invoice_id = ?`, [invoiceId])

        // Generate supplier token
        const token = generateToken()
        const tokenExpiry = new Date()
        tokenExpiry.setDate(tokenExpiry.getDate() + 14)

        await connection.execute(
          `INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at)
           VALUES (?, ?, 'offer_access', ?)`,
          [invoice.supplier_id, token, tokenExpiry],
        )

        created.push({
          invoiceId,
          invoiceNumber: invoice.invoice_number ?? null,
          supplierEmail: invoice.contact_email ?? null,
          token,
        })
      } catch (error: any) {
        errors.push(`Invoice ${invoiceId}: ${error.message}`)
      }
    }

    return { created, errors }
  })
}

// Generate offers for eligible invoices - now reusing shared helper
export async function generateOffers(invoiceIds: number[]) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    const results = await createOffersForInvoices(invoiceIds)

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "OFFERS_GENERATED",
      details: `Generated ${results.created.length} offers, ${results.errors.length} errors`,
    })

    return results
  } catch (error) {
    console.error("[v0] Error generating offers:", error)
    throw error
  }
}

export async function autoGenerateOffersForEligibleInvoices(triggerSource = "system") {
  try {
    const eligibleInvoices = await query<RowDataPacket[]>(
      `SELECT i.invoice_id
       FROM invoices i
       JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
       LEFT JOIN offers o ON o.invoice_id = i.invoice_id
       WHERE i.status = 'matched'
         AND s.onboarding_status = 'approved'
         AND i.due_date > NOW()
         AND o.offer_id IS NULL`,
    )

    const invoiceIds = eligibleInvoices.map((row) => Number(row.invoice_id)).filter((id) => !Number.isNaN(id))

    const results = await createOffersForInvoices(invoiceIds)

    if (results.created.length > 0 || results.errors.length > 0) {
      await createAuditLog({
        userType: "system",
        action: "AUTO_OFFERS_GENERATED",
        details: `Auto-generated ${results.created.length} offers, ${results.errors.length} errors (trigger: ${triggerSource})`,
      })
    }

    return results
  } catch (error) {
    console.error("[v0] Error auto-generating offers:", error)
    throw error
  }
}

export async function autoGenerateOffersForSupplier(supplierId: number, triggerSource = "supplier") {
  try {
    const eligibleInvoices = await query<RowDataPacket[]>(
      `SELECT i.invoice_id
       FROM invoices i
       JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
       LEFT JOIN offers o ON o.invoice_id = i.invoice_id
       WHERE s.supplier_id = ?
         AND s.onboarding_status = 'approved'
         AND i.status = 'matched'
         AND i.due_date > NOW()
         AND o.offer_id IS NULL`,
      [supplierId],
    )

    const invoiceIds = eligibleInvoices.map((row) => Number(row.invoice_id)).filter((id) => !Number.isNaN(id))
    const results = await createOffersForInvoices(invoiceIds)

    if (results.created.length > 0 || results.errors.length > 0) {
      await createAuditLog({
        userType: "system",
        action: "AUTO_OFFERS_GENERATED",
        details: `Auto-generated ${results.created.length} offers, ${results.errors.length} errors (trigger: ${triggerSource}, supplier: ${supplierId})`,
      })
    }

    return results
  } catch (error) {
    console.error("[v0] Error auto-generating offers for supplier:", error)
    throw error
  }
}

// Get all invoices for admin - UPDATED for new structure
export async function getAllInvoices() {
  // Allow any logged-in user to fetch all invoices

  try {
    const invoices = await query(
      `SELECT i.invoice_id, i.document_number, i.reference_invoice, i.document_date, 
        i.due_date, i.amount, i.currency, i.status, i.uploaded_at,
        i.vendor_number, i.payment_terms, i.company_code,
        i.vendor_number as supplier_name, -- Using vendor_number as supplier name placeholder
        i.company_code as buyer_name, -- Using company_code as buyer name placeholder
        COUNT(o.offer_id) as offer_count
       FROM invoices i
       LEFT JOIN offers o ON i.invoice_id = o.invoice_id
       GROUP BY i.invoice_id
       ORDER BY i.uploaded_at DESC
       LIMIT 100`,
    )

    return invoices
  } catch (error) {
    console.error("[v0] Error fetching all invoices:", error)
    throw error
  }
}