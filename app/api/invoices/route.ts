import { getInvoicesForSession } from "@/lib/actions/invoices";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const invoices = await getInvoicesForSession();
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("[API] Error fetching invoices:", error);
    const message = error?.message || "Internal server error";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
