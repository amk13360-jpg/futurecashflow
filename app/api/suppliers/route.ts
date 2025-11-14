import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const suppliers = await query(
      `SELECT supplier_id, name, vat_no, registration_no, contact_person,
              contact_email, contact_phone, physical_address,
              bank_name, bank_account_no, bank_branch_code, bank_account_type,
              risk_tier, onboarding_status, active_status
       FROM suppliers
       ORDER BY name ASC`
    )
    return NextResponse.json(suppliers)
  } catch (error: any) {
    return NextResponse.json([], { status: 500 })
  }
}
