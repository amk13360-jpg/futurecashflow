/**
 * CSP Nonce Generation Utility
 * Provides cryptographically secure nonces for Content Security Policy
 * 
 * Usage in middleware:
 * 1. Generate nonce: generateCSPNonce()
 * 2. Add to headers with nonce-based CSP
 * 3. Pass nonce to pages via header
 */

import { randomBytes } from "crypto"

/**
 * Generate a cryptographically secure CSP nonce
 * Returns a base64-encoded 16-byte random value
 */
export function generateCSPNonce(): string {
  return randomBytes(16).toString("base64")
}

/**
 * Build Content-Security-Policy header with nonce
 */
export function buildCSPHeader(nonce: string): string {
  const directives = [
    // Default: only allow same-origin
    "default-src 'self'",
    
    // Scripts: self + nonce for inline scripts
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    
    // Styles: self + unsafe-inline (required for many CSS-in-JS libraries)
    // For stricter CSP, you could also use nonces for styles
    "style-src 'self' 'unsafe-inline'",
    
    // Images: self + data URIs + HTTPS
    "img-src 'self' data: blob: https:",
    
    // Fonts: self + data URIs
    "font-src 'self' data:",
    
    // Connect: self + HTTPS APIs
    "connect-src 'self' https:",
    
    // Frame ancestors: prevent clickjacking
    "frame-ancestors 'self'",
    
    // Form actions: only allow same-origin
    "form-action 'self'",
    
    // Base URI: prevent base tag hijacking
    "base-uri 'self'",
    
    // Object/embed: block plugins
    "object-src 'none'",
    
    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ]

  return directives.join("; ")
}

/**
 * CSP Report-Only header for testing new policies
 * Use this to test CSP changes without breaking functionality
 */
export function buildCSPReportOnlyHeader(nonce: string, reportUri?: string): string {
  let csp = buildCSPHeader(nonce)
  
  if (reportUri) {
    csp += `; report-uri ${reportUri}`
  }
  
  return csp
}

/**
 * Extract nonce from request headers
 * Used by pages/components to get the current nonce
 */
export function getNonceFromHeaders(headers: Headers): string | null {
  return headers.get("x-csp-nonce")
}

/**
 * Development mode CSP (more permissive for hot reload, etc.)
 */
export function buildDevCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' https: http: ws: wss:",
    "frame-ancestors 'self'",
  ].join("; ")
}
