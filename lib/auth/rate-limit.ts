/**
 * Rate Limiting Utility
 * Provides in-memory rate limiting for authentication endpoints
 * For production with multiple instances, consider using Redis
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (for single instance deployments)
// For multi-instance deployments, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number   // Seconds until rate limit resets (only set when blocked)
}

/**
 * Check rate limit for a given identifier (e.g., IP address, user ID)
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const key = identifier
  
  let entry = rateLimitStore.get(key)
  
  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, entry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    }
  }
  
  // Increment count
  entry.count++
  
  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    }
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Clear rate limit for a given identifier (e.g., after successful login)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Strict limit for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5             // 5 attempts per 15 minutes
  },
  // OTP verification - slightly more lenient
  OTP: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10            // 10 attempts per 15 minutes
  },
  // Password reset requests
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 3             // 3 requests per hour
  },
  // General API rate limiting
  API: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 100           // 100 requests per minute
  }
} as const

/**
 * Get client IP from request headers
 * Handles various proxy configurations
 */
export function getClientIP(headers: Headers): string {
  // Check for forwarded headers (behind proxy/load balancer)
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(",")[0].trim()
  }
  
  // Check for real IP header (Cloudflare, nginx)
  const realIP = headers.get("x-real-ip")
  if (realIP) {
    return realIP.trim()
  }
  
  // Check for CF-Connecting-IP (Cloudflare)
  const cfIP = headers.get("cf-connecting-ip")
  if (cfIP) {
    return cfIP.trim()
  }
  
  // Fallback - this shouldn't happen in production
  return "unknown"
}
