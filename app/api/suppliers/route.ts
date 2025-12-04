import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Admin can see all suppliers, AP users only see their buyer's suppliers
    let suppliers
    if (session.role === "admin") {
      suppliers = await query(
        `SELECT supplier_id, name, vat_no, registration_no, contact_person,
                contact_email, contact_phone, physical_address,
                bank_name, bank_account_no, bank_branch_code, bank_account_type,
                risk_tier, onboarding_status, active_status, company_code
         FROM suppliers
         ORDER BY name ASC`
      )
    } else if (session.role === "accounts_payable" && session.buyerId) {
      // Get the buyer code for this AP user
      const buyers = await query<Array<{ code: string }>>(
        `SELECT code FROM buyers WHERE buyer_id = ?`,
        [session.buyerId]
      )
      
      if (buyers.length === 0) {
        return NextResponse.json([])
      }
      
      const buyerCode = buyers[0].code
      suppliers = await query(
        `SELECT supplier_id, name, vat_no, registration_no, contact_person,
                contact_email, contact_phone, physical_address,
                bank_name, bank_account_no, bank_branch_code, bank_account_type,
                risk_tier, onboarding_status, active_status, company_code
         FROM suppliers
         WHERE company_code = ?
         ORDER BY name ASC`,
        [buyerCode]
      )
    } else {
      // Other roles (like supplier) should not access this endpoint
      return NextResponse.json([])
    }
    
    return NextResponse.json(suppliers)
  } catch (error: any) {
    return NextResponse.json([], { status: 500 })
  }
}
