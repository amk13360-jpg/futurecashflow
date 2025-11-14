

import { getAllInvoices } from "@/lib/actions/invoices";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const invoices = await getAllInvoices();
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}
