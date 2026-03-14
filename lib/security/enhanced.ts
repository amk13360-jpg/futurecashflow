// Enhanced security functions for SCF Platform
import { randomBytes, createHash } from "crypto"
import { NextRequest } from "next/server"

// Session rotation configuration
export const SESSION_CONFIG = {
  ROTATION_INTERVAL: 15 * 60 * 1000, // 15 minutes
  MAX_SESSION_AGE: 4 * 60 * 60 * 1000, // 4 hours
  SECURE_RANDOM_BYTES: 32,
}

/**
 * Generate cryptographically secure session ID
 */
export function generateSecureSessionId(): string {
  return randomBytes(SESSION_CONFIG.SECURE_RANDOM_BYTES).toString("hex")
}

/**
 * Hash IP address for session binding (privacy-preserving)
 */
export function hashIPAddress(ip: string, salt?: string): string {
  const sessionSalt = salt || process.env.SESSION_SALT || "default-salt-change-in-production"
  return createHash("sha256").update(ip + sessionSalt).digest("hex").substring(0, 16)
}

/**
 * Hash User-Agent for session binding
 */
export function hashUserAgent(userAgent: string, salt?: string): string {
  const sessionSalt = salt || process.env.SESSION_SALT || "default-salt-change-in-production"
  return createHash("sha256").update(userAgent + sessionSalt).digest("hex").substring(0, 16)
}

/**
 * Extract real IP address with proxy support
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const clientIp = request.headers.get("client-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  if (realIp) {
    return realIp.trim()
  }
  
  if (clientIp) {
    return clientIp.trim()
  }
  
  return "unknown"
}

/**
 * Validate session requires rotation
 */
export function requiresSessionRotation(lastRotation: number): boolean {
  return Date.now() - lastRotation > SESSION_CONFIG.ROTATION_INTERVAL
}

/**
 * Validate session is not expired
 */
export function isSessionExpired(loginTime: number): boolean {
  return Date.now() - loginTime > SESSION_CONFIG.MAX_SESSION_AGE
}

/**
 * Enhanced rate limiting with multiple factors
 */
export interface EnhancedRateLimit {
  key: string
  windowMs: number
  maxAttempts: number
  blockDuration: number
  factors: ("ip" | "userAgent" | "endpoint")[]
}

export const ENHANCED_RATE_LIMITS = {
  LOGIN: {
    key: "login",
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDuration: 30 * 60 * 1000, // 30 minutes
    factors: ["ip", "userAgent"] as const
  },
  API_CALLS: {
    key: "api",
    windowMs: 1 * 60 * 1000, // 1 minute
    maxAttempts: 100,
    blockDuration: 5 * 60 * 1000, // 5 minutes
    factors: ["ip"] as const
  },
  FILE_UPLOAD: {
    key: "upload",
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 10,
    blockDuration: 15 * 60 * 1000, // 15 minutes
    factors: ["ip", "userAgent"] as const
  }
} as const

/**
 * Generate composite rate limit key
 */
export function generateRateLimitKey(
  request: NextRequest, 
  config: EnhancedRateLimit
): string {
  const factors = []
  
  if (config.factors.includes("ip")) {
    factors.push(hashIPAddress(getClientIP(request)))
  }
  
  if (config.factors.includes("userAgent")) {
    factors.push(hashUserAgent(request.headers.get("user-agent") || ""))
  }
  
  if (config.factors.includes("endpoint")) {
    factors.push(request.nextUrl.pathname)
  }
  
  return `${config.key}:${factors.join(":")}`
}

/**
 * Sanitize and validate file names to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  fileName = fileName.replace(/\.\.\//g, "").replace(/\.\.\\/g, "")
  
  // Remove null bytes and control characters
  fileName = fileName.replace(/[\x00-\x1f\x80-\x9f]/g, "")
  
  // Restrict to safe characters
  fileName = fileName.replace(/[^a-zA-Z0-9\-_.()]/g, "_")
  
  // Limit length
  if (fileName.length > 255) {
    const ext = fileName.split(".").pop()
    fileName = fileName.substring(0, 250 - (ext?.length || 0)) + "." + ext
  }
  
  return fileName || "unnamed_file"
}

/**
 * Enhanced PDF validation beyond magic bytes
 */
export function validatePDFContent(buffer: Buffer): { valid: boolean; error?: string } {
  // Check PDF magic bytes
  const pdfMagic = buffer.subarray(0, 5).toString('ascii')
  if (pdfMagic !== '%PDF-') {
    return { valid: false, error: "Invalid PDF magic bytes" }
  }
  
  // Check for PDF version
  const version = buffer.subarray(5, 8).toString('ascii')
  const validVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0']
  if (!validVersions.includes(version)) {
    return { valid: false, error: "Unsupported PDF version" }
  }
  
  // Check for EOF marker
  const endMarker = buffer.subarray(-10).toString('ascii')
  if (!endMarker.includes('%%EOF')) {
    return { valid: false, error: "Missing PDF EOF marker" }
  }
  
  // Scan for suspicious content (basic XSS/script detection)
  const content = buffer.toString('ascii', 0, Math.min(buffer.length, 10000))
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: "Suspicious content detected" }
    }
  }
  
  return { valid: true }
}

/**
 * CSRF Token Management
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Validate CSRF token with timing-safe comparison
 */
export function validateCSRFToken(provided: string, expected: string): boolean {
  if (!provided || !expected) return false
  if (provided.length !== expected.length) return false
  
  // Timing-safe comparison
  let result = 0
  for (let i = 0; i < provided.length; i++) {
    result |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  
  // XSS protection
  "X-XSS-Protection": "1; mode=block",
  
  // Prevent framing
  "X-Frame-Options": "DENY",
  
  // Force HTTPS
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  
  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  
  // Content security policy (will be set dynamically in middleware)
  // "Content-Security-Policy": "..."
} as const

/**
 * XSS detection patterns
 */
export const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form[^>]*action/gi
]

/**
 * Detect potential XSS attacks
 */
export function detectXSS(input: string): boolean {
  if (!input) return false
  return XSS_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Path traversal detection patterns  
 */
export const PATH_TRAVERSAL_PATTERNS = [
  /\.\./g,
  /\.\.\/+/g,
  /\.\.\\+/g,
  /%2e%2e/gi,
  /%252e%252e/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /\.\.%255c/gi,
]

/**
 * Detect path traversal attempts
 */
export function detectPathTraversal(input: string): boolean {
  if (!input) return false
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * SQL injection detection patterns
 */
export const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|HAVING|ORDER BY|GROUP BY)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/i,
  /('|\"|`|\$)/,
  /(\bSCRIPT\b.*>)/i,
  /(\bON\w+\s*=)/i
]

/**
 * Detect potential SQL injection attempts
 */
export function detectSQLInjection(input: string): boolean {
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return true
    }
  }
  return false
}

/**
 * Secure logging function that redacts sensitive data
 */
export function secureLog(level: "info" | "warn" | "error", message: string, data?: any): void {
  const redactPatterns = [
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit cards
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    /(password|token|secret|key)["\s]*:[\s]*["'][^"']*["']/gi, // Passwords/tokens
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN patterns
  ]
  
  let sanitizedMessage = message
  let sanitizedData = data ? JSON.stringify(data) : ""
  
  redactPatterns.forEach(pattern => {
    sanitizedMessage = sanitizedMessage.replace(pattern, "[REDACTED]")
    sanitizedData = sanitizedData.replace(pattern, "[REDACTED]")
  })
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: sanitizedMessage,
    ...(data && { data: sanitizedData })
  }
  
  console[level](logEntry)
}

/**
 * Generate a cryptographically secure random token
 */
export function generateRandomToken(length: number = 32): string {
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    // Fallback for Node.js environment
    const cryptoNode = require('crypto')
    const randomBytes = cryptoNode.randomBytes(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = randomBytes[i]
    }
  }
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Secure error handling with information disclosure prevention
 */
export function sanitizeError(error: unknown, context?: string): { 
  userMessage: string
  logMessage: string 
  statusCode: number
} {
  const timestamp = Date.now()
  const errorId = generateRandomToken(8)
  
  let userMessage = "An internal error occurred"
  let logMessage = "Unknown error"
  let statusCode = 500
  
  if (error instanceof Error) {
    logMessage = `${context || 'Error'}: ${error.message}`
    
    // Map specific error types to safe user messages
    if (error.message.toLowerCase().includes('unauthorized') || 
        error.message.toLowerCase().includes('access denied')) {
      userMessage = "Access denied"
      statusCode = 403
    } else if (error.message.toLowerCase().includes('not found')) {
      userMessage = "Resource not found"
      statusCode = 404
    } else if (error.message.toLowerCase().includes('invalid') ||
               error.message.toLowerCase().includes('required')) {
      userMessage = "Invalid request data"
      statusCode = 400
    } else if (error.message.toLowerCase().includes('rate limit')) {
      userMessage = "Too many requests. Please try again later"
      statusCode = 429
    }
  } else {
    logMessage = `${context || 'Error'}: ${String(error)}`
  }
  
  // Log the full error details securely
  secureLog('error', `${logMessage} [ErrorID: ${errorId}]`, {
    errorId,
    context,
    timestamp,
    stack: error instanceof Error ? error.stack : undefined
  })
  
  return {
    userMessage: `${userMessage}. Reference: ${errorId}`,
    logMessage,
    statusCode
  }
}

/**
 * API error response helper with information disclosure prevention
 */
export function createErrorResponse(error: unknown, context?: string) {
  const { userMessage, statusCode } = sanitizeError(error, context)
  
  return Response.json(
    { 
      error: userMessage,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  )
}