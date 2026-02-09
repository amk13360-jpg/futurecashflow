/**
 * Input Validation Utilities
 * Provides secure input validation and sanitization functions
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Phone number validation (basic international format)
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/

// South African VAT number format
const VAT_REGEX = /^[0-9]{10}$/

// Bank account number (digits only, reasonable length)
const BANK_ACCOUNT_REGEX = /^[0-9]{6,20}$/

// Branch code format
const BRANCH_CODE_REGEX = /^[0-9]{5,6}$/

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  if (email.length > 254) return false // Max email length per RFC
  return EMAIL_REGEX.test(email.trim())
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false
  if (phone.length > 20) return false
  return PHONE_REGEX.test(phone.trim())
}

/**
 * Validate South African VAT number
 */
export function isValidVATNumber(vat: string): boolean {
  if (!vat || typeof vat !== "string") return false
  return VAT_REGEX.test(vat.trim())
}

/**
 * Validate bank account number
 */
export function isValidBankAccount(account: string): boolean {
  if (!account || typeof account !== "string") return false
  return BANK_ACCOUNT_REGEX.test(account.trim())
}

/**
 * Validate branch code
 */
export function isValidBranchCode(code: string): boolean {
  if (!code || typeof code !== "string") return false
  return BRANCH_CODE_REGEX.test(code.trim())
}

/**
 * Sanitize string input - remove potentially dangerous characters
 * This is a defense-in-depth measure; parameterized queries are the primary defense
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== "string") return ""
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
}

/**
 * Validate and sanitize username
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== "string") return false
  if (username.length < 3 || username.length > 50) return false
  // Only allow alphanumeric, underscore, hyphen
  return /^[a-zA-Z0-9_-]+$/.test(username)
}

/**
 * Validate password strength
 * Returns an object with validation result and specific issues
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (!password || typeof password !== "string") {
    return { isValid: false, issues: ["Password is required"] }
  }

  if (password.length < 8) {
    issues.push("Password must be at least 8 characters long")
  }
  if (password.length > 128) {
    issues.push("Password must be less than 128 characters")
  }
  if (!/[a-z]/.test(password)) {
    issues.push("Password must contain at least one lowercase letter")
  }
  if (!/[A-Z]/.test(password)) {
    issues.push("Password must contain at least one uppercase letter")
  }
  if (!/[0-9]/.test(password)) {
    issues.push("Password must contain at least one number")
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push("Password must contain at least one special character")
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  if (!invoiceNumber || typeof invoiceNumber !== "string") return false
  if (invoiceNumber.length > 50) return false
  // Allow alphanumeric, hyphens, and slashes
  return /^[a-zA-Z0-9\-/]+$/.test(invoiceNumber)
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  if (typeof value !== "number") return false
  return !isNaN(value) && isFinite(value) && value > 0
}

/**
 * Validate currency amount (positive with up to 2 decimal places)
 */
export function isValidCurrencyAmount(amount: number): boolean {
  if (!isPositiveNumber(amount)) return false
  // Check for reasonable precision (2 decimal places)
  const decimalStr = amount.toString()
  const decimalIndex = decimalStr.indexOf(".")
  if (decimalIndex !== -1) {
    const decimals = decimalStr.length - decimalIndex - 1
    if (decimals > 2) return false
  }
  // Check for reasonable maximum (prevent integer overflow attacks)
  if (amount > 999999999999.99) return false
  return true
}

/**
 * Validate date string (ISO 8601 format)
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * Validate OTP code (6 digits)
 */
export function isValidOTP(otp: string): boolean {
  if (!otp || typeof otp !== "string") return false
  return /^[0-9]{6}$/.test(otp)
}

/**
 * Escape HTML entities to prevent XSS in server-rendered content
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return ""
  
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;"
  }
  
  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char] || char)
}
