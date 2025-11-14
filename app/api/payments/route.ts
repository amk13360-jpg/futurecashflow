import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
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
       ORDER BY p.created_at DESC`
    )
    return NextResponse.json(payments)
  } catch (error: any) {
    return NextResponse.json([], { status: 500 })
  }
}
