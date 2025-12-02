import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      userId: session.userId,
      username: session.username,
      email: session.email,
      role: session.role,
      buyerId: session.buyerId,
      fullName: session.fullName,
      buyerName: session.buyerName,
    })
  } catch (error) {
    console.error("[API] Session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
