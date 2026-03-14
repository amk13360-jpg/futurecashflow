/**
 * Enhanced authorization utilities for SCF Platform
 * Prevents IDOR attacks and ensures proper access control
 */

import { query } from "@/lib/db"
import { getSession, SessionData } from "@/lib/auth/session"
import { secureLog } from "./enhanced"
import type { RowDataPacket } from "mysql2"

/**
 * Validate buyer ownership for accounts payable operations
 * Prevents IDOR attacks on buyer-specific resources
 */
export async function validateBuyerOwnership(
  session: SessionData,
  buyerId: number,
  resourceType: string,
  resourceId?: string | number
): Promise<{ valid: boolean; error?: string }> {
  
  // Admin users can access all buyers
  if (session.role === "admin") {
    return { valid: true }
  }
  
  // AP users can only access their assigned buyer
  if (session.role === "accounts_payable") {
    if (!session.buyerId) {
      secureLog('warn', 'AP user without buyerId attempted access', {
        userId: session.userId,
        username: session.username,
        targetBuyerId: buyerId,
        resourceType,
        resourceId
      })
      return { valid: false, error: "Invalid session: missing buyer assignment" }
    }
    
    if (session.buyerId !== buyerId) {
      secureLog('warn', 'IDOR attempt detected - buyer access violation', {
        userId: session.userId,
        username: session.username,
        sessionBuyerId: session.buyerId,
        targetBuyerId: buyerId,
        resourceType,
        resourceId
      })
      return { valid: false, error: "Access denied: unauthorized buyer access" }
    }
  }
  
  return { valid: true }
}

/**
 * Validate supplier ownership for supplier operations
 * Prevents suppliers from accessing other suppliers' data
 */
export async function validateSupplierOwnership(
  supplierId: number,
  targetSupplierId: number,
  resourceType: string,
  resourceId?: string | number
): Promise<{ valid: boolean; error?: string }> {
  
  if (supplierId !== targetSupplierId) {
    secureLog('warn', 'IDOR attempt detected - supplier access violation', {
      sessionSupplierId: supplierId,
      targetSupplierId,
      resourceType,
      resourceId
    })
    return { valid: false, error: "Access denied: unauthorized supplier access" }
  }
  
  return { valid: true }
}

/**
 * Validate cession agreement access
 * Ensures proper buyer-cession relationship
 */
export async function validateCessionAccess(
  session: SessionData,
  cessionId: number
): Promise<{ valid: boolean; error?: string; cession?: any }> {
  
  try {
    const [cessions] = await query<RowDataPacket[]>(
      `SELECT c.*, s.name as supplier_name 
       FROM cession_agreements c 
       JOIN suppliers s ON c.supplier_id = s.supplier_id 
       WHERE c.cession_id = ?`,
      [cessionId]
    )
    
    if (cessions.length === 0) {
      return { valid: false, error: "Cession agreement not found" }
    }
    
    const cession = cessions[0]
    
    // Admin can access all cessions
    if (session.role === "admin") {
      return { valid: true, cession }
    }
    
    // AP users can only access cessions for their buyer
    if (session.role === "accounts_payable") {
      const buyerValidation = await validateBuyerOwnership(
        session, 
        cession.buyer_id, 
        "cession_agreement", 
        cessionId
      )
      
      if (!buyerValidation.valid) {
        return buyerValidation
      }
    }
    
    return { valid: true, cession }
    
  } catch (error) {
    secureLog('error', 'Cession access validation failed', {
      userId: session.userId,
      cessionId,
      error: error instanceof Error ? error.message : String(error)
    })
    return { valid: false, error: "Validation error" }
  }
}

/**
 * Validate invoice access and ownership
 */
export async function validateInvoiceAccess(
  session: SessionData,
  invoiceId: number
): Promise<{ valid: boolean; error?: string; invoice?: any }> {
  
  try {
    const [invoices] = await query<RowDataPacket[]>(
      `SELECT i.*, s.supplier_id, s.name as supplier_name
       FROM invoices i
       JOIN suppliers s ON i.supplier_id = s.supplier_id
       WHERE i.invoice_id = ?`,
      [invoiceId]
    )
    
    if (invoices.length === 0) {
      return { valid: false, error: "Invoice not found" }
    }
    
    const invoice = invoices[0]
    
    // Admin can access all invoices
    if (session.role === "admin") {
      return { valid: true, invoice }
    }
    
    // AP users can only access invoices for their buyer
    if (session.role === "accounts_payable") {
      const buyerValidation = await validateBuyerOwnership(
        session,
        invoice.buyer_id,
        "invoice",
        invoiceId
      )
      
      if (!buyerValidation.valid) {
        return buyerValidation
      }
    }
    
    return { valid: true, invoice }
    
  } catch (error) {
    secureLog('error', 'Invoice access validation failed', {
      userId: session.userId,
      invoiceId,
      error: error instanceof Error ? error.message : String(error)
    })
    return { valid: false, error: "Validation error" }
  }
}

/**
 * Validate payment access and ownership
 */
export async function validatePaymentAccess(
  session: SessionData,
  paymentId: number
): Promise<{ valid: boolean; error?: string; payment?: any }> {
  
  try {
    const [payments] = await query<RowDataPacket[]>(
      `SELECT p.*, i.buyer_id, s.name as supplier_name
       FROM payments p
       JOIN offers o ON p.offer_id = o.offer_id
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN suppliers s ON i.supplier_id = s.supplier_id
       WHERE p.payment_id = ?`,
      [paymentId]
    )
    
    if (payments.length === 0) {
      return { valid: false, error: "Payment not found" }
    }
    
    const payment = payments[0]
    
    // Admin can access all payments
    if (session.role === "admin") {
      return { valid: true, payment }
    }
    
    // AP users can only access payments for their buyer
    if (session.role === "accounts_payable") {
      const buyerValidation = await validateBuyerOwnership(
        session,
        payment.buyer_id,
        "payment",
        paymentId
      )
      
      if (!buyerValidation.valid) {
        return buyerValidation
      }
    }
    
    return { valid: true, payment }
    
  } catch (error) {
    secureLog('error', 'Payment access validation failed', {
      userId: session.userId,
      paymentId,
      error: error instanceof Error ? error.message : String(error)
    })
    return { valid: false, error: "Validation error" }
  }
}

/**
 * Enhanced session validation with additional security checks
 */
export async function validateSecureSession(requireRecent = false): Promise<{
  valid: boolean
  error?: string
  session?: SessionData
}> {
  try {
    const session = await getSession()
    
    if (!session) {
      return { valid: false, error: "Authentication required" }
    }
    
    // Check for recent authentication if required
    if (requireRecent && session.loginTime) {
      const maxAge = 30 * 60 * 1000 // 30 minutes
      if (Date.now() - session.loginTime > maxAge) {
        secureLog('warn', 'Recent authentication required', {
          userId: session.userId,
          loginTime: session.loginTime,
          maxAge
        })
        return { valid: false, error: "Recent authentication required" }
      }
    }
    
    return { valid: true, session }
    
  } catch (error) {
    secureLog('error', 'Session validation error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return { valid: false, error: "Session validation failed" }
  }
}

/**
 * Input validation for common attack patterns
 */
export function validateInput(input: string, type: 'email' | 'username' | 'numeric' | 'general'): {
  valid: boolean
  sanitized?: string
  error?: string
} {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: "Invalid input type" }
  }
  
  // Length limits
  if (input.length > 255) {
    return { valid: false, error: "Input too long" }
  }
  
  // Remove null bytes and control characters
  const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  switch (type) {
    case 'email':
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(sanitized)) {
        return { valid: false, error: "Invalid email format" }
      }
      break
      
    case 'username':
      const usernameRegex = /^[a-zA-Z0-9._-]+$/
      if (!usernameRegex.test(sanitized) || sanitized.length < 3) {
        return { valid: false, error: "Invalid username format" }
      }
      break
      
    case 'numeric':
      const numericRegex = /^\d+$/
      if (!numericRegex.test(sanitized)) {
        return { valid: false, error: "Invalid numeric format" }
      }
      break
      
    case 'general':
      // Basic XSS protection
      if (/<script|javascript:|vbscript:|onload=|onerror=/i.test(sanitized)) {
        return { valid: false, error: "Potentially malicious content" }
      }
      break
  }
  
  return { valid: true, sanitized }
}

/**
 * Database transaction wrapper with security logging
 */
export async function secureTransaction<T>(
  operation: string,
  userId: number,
  callback: (connection: any) => Promise<T>
): Promise<T> {
  const { transaction } = await import("@/lib/db")
  
  secureLog('info', 'Secure transaction initiated', {
    operation,
    userId,
    timestamp: Date.now()
  })
  
  try {
    const result = await transaction(callback)
    
    secureLog('info', 'Secure transaction completed', {
      operation,
      userId,
      success: true
    })
    
    return result
    
  } catch (error) {
    secureLog('error', 'Secure transaction failed', {
      operation,
      userId,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}