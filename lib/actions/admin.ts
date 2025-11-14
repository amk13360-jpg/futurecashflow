"use server"

import { query } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

// Get dashboard metrics
export async function getDashboardMetrics() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    // Pending documents count
    const [pendingDocs] = await query<[{ count: number }]>(
      `SELECT COUNT(*) as count FROM cession_agreements WHERE status = 'pending'`,
    )

    // Total applications
    const [totalApps] = await query<[{ count: number }]>(
      `SELECT COUNT(*) as count FROM suppliers WHERE onboarding_status IN ('pending', 'documents_submitted')`,
    )

    // Registered suppliers
    const [registeredSuppliers] = await query<[{ count: number }]>(
      `SELECT COUNT(*) as count FROM suppliers WHERE onboarding_status = 'approved'`,
    )

    // 48h payments issued
    const [recentPayments] = await query<[{ total: number }]>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments 
       WHERE status = 'completed' AND completed_date >= DATE_SUB(NOW(), INTERVAL 48 HOUR)`,
    )

    return {
      pendingDocuments: pendingDocs.count,
      totalApplications: totalApps.count,
      registeredSuppliers: registeredSuppliers.count,
      paymentsIssued48h: recentPayments.total,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard metrics:", error)
    throw error
  }
}

// Get pending supplier applications
export async function getPendingApplications() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const applications = await query(
      `SELECT supplier_id, name, vat_no, contact_email, contact_phone, 
              onboarding_status, created_at
       FROM suppliers 
       WHERE onboarding_status IN ('pending', 'documents_submitted')
       ORDER BY created_at DESC`,
    )

    return applications
  } catch (error) {
    console.error("[v0] Error fetching pending applications:", error)
    throw error
  }
}

// Get pending cession agreements
export async function getPendingCessions() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const cessions = await query(
      `SELECT c.cession_id, c.supplier_id, c.document_url, c.document_type, 
              c.signed_date, c.status, c.created_at,
              s.name as supplier_name, s.contact_email
       FROM cession_agreements c
       JOIN suppliers s ON c.supplier_id = s.supplier_id
       WHERE c.status IN ('pending', 'signed')
       ORDER BY c.created_at DESC`,
    )

    return cessions
  } catch (error) {
    console.error("[v0] Error fetching pending cessions:", error)
    throw error
  }
}

// Get bank change requests
export async function getBankChangeRequests() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const requests = await query(
      `SELECT b.request_id, b.supplier_id, b.new_bank_name, b.new_account_no,
              b.new_branch_code, b.reason, b.status, b.created_at,
              s.name as supplier_name, s.contact_email
       FROM bank_change_requests b
       JOIN suppliers s ON b.supplier_id = s.supplier_id
       WHERE b.status = 'pending'
       ORDER BY b.created_at DESC`,
    )

    return requests
  } catch (error) {
    console.error("[v0] Error fetching bank change requests:", error)
    throw error
  }
}

// Get all suppliers
export async function getAllSuppliers() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const suppliers = await query(
      `SELECT supplier_id, name, vat_no, contact_email, contact_phone,
              bank_name, bank_account_no, risk_tier, onboarding_status, 
              active_status, created_at
       FROM suppliers 
       ORDER BY created_at DESC`,
    )

    return suppliers
  } catch (error) {
    console.error("[v0] Error fetching suppliers:", error)
    throw error
  }
}

// Get recent payments
export async function getRecentPayments() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  try {
    const payments = await query(
      `SELECT p.payment_id, p.amount, p.currency, p.payment_reference,
              p.status, p.scheduled_date, p.completed_date, p.batch_id,
              s.name as supplier_name, s.contact_email
       FROM payments p
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       ORDER BY p.created_at DESC
       LIMIT 50`,
    )

    return payments
  } catch (error) {
    console.error("[v0] Error fetching recent payments:", error)
    throw error
  }
}
