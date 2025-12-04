import { getInvoicesForSession } from "@/lib/actions/invoices";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const invoices = await getInvoicesForSession();
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("[API] Error fetching invoices:", error);
    return NextResponse.json([], { status: 500 });
  }
}
