/**
 * Redis-based Rate Limiting
 * Provides distributed rate limiting for multi-instance deployments
 * Falls back to in-memory rate limiting if Redis is not available
 * 
 * Configuration:
 * - REDIS_URL: Redis connection string (e.g., redis://localhost:6379)
 * - RATE_LIMIT_USE_REDIS: Set to "true" to enable Redis rate limiting
 * 
 * Optional dependency: npm install ioredis
 */

import { 
  RateLimitConfig, 
  RateLimitResult, 
  checkRateLimit as checkInMemoryRateLimit,
  clearRateLimit as clearInMemoryRateLimit 
} from "./rate-limit"

// Type definitions for ioredis (to avoid build errors when not installed)
interface RedisClient {
  zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>
  zcard(key: string): Promise<number>
  zrange(key: string, start: number, stop: number, options?: { WITHSCORES: boolean }): Promise<Array<{ value: string; score: number }> | string[]>
  zadd(key: string, ...args: Array<number | string>): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  del(key: string): Promise<number>
  quit(): Promise<string>
  on(event: string, callback: (...args: unknown[]) => void): void
}

// Redis client singleton
let redisClient: RedisClient | null = null
let redisConnected = false
let redisConnectionAttempted = false

// Configuration
const REDIS_URL = process.env.REDIS_URL
const USE_REDIS = process.env.RATE_LIMIT_USE_REDIS === "true" && !!REDIS_URL

/**
 * Initialize Redis client using dynamic import (avoids build errors if ioredis not installed)
 */
async function getRedisClient(): Promise<RedisClient | null> {
  if (!USE_REDIS) {
    return null
  }

  if (redisConnectionAttempted) {
    return redisConnected ? redisClient : null
  }

  redisConnectionAttempted = true

  try {
    // Dynamic import to avoid build errors when ioredis is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis")
    
    redisClient = new Redis(REDIS_URL!, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.warn("[Redis Rate Limit] Max reconnection attempts reached, falling back to in-memory")
          return null
        }
        return Math.min(times * 100, 3000)
      }
    }) as unknown as RedisClient

    redisClient.on("error", (...args: unknown[]) => {
      const err = args[0] as { message?: string }
      console.error("[Redis Rate Limit] Connection error:", err?.message || "Unknown error")
      redisConnected = false
    })

    redisClient.on("connect", () => {
      console.log("[Redis Rate Limit] Connected successfully")
      redisConnected = true
    })

    redisClient.on("close", () => {
      console.warn("[Redis Rate Limit] Disconnected, will use in-memory fallback")
      redisConnected = false
    })

    redisConnected = true
    return redisClient
  } catch (error) {
    console.error("[Redis Rate Limit] Failed to initialize:", error instanceof Error ? error.message : error)
    redisConnected = false
    return null
  }
}

/**
 * Check rate limit using Redis (with sliding window)
 */
async function checkRedisRateLimit(
  identifier: string, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const client = await getRedisClient()
  
  if (!client || !redisConnected) {
    // Fallback to in-memory
    return checkInMemoryRateLimit(identifier, config)
  }

  try {
    const key = `ratelimit:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Use Redis sorted set for sliding window
    // Remove old entries outside the window
    await client.zremrangebyscore(key, 0, windowStart)
    
    // Count requests in current window
    const count = await client.zcard(key)
    
    if (count >= config.maxRequests) {
      // Rate limit exceeded
      const resetTime = now + config.windowMs
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(config.windowMs / 1000)
      }
    }

    // Add current request with score as timestamp
    await client.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`)
    
    // Set expiry on the key
    await client.expire(key, Math.ceil(config.windowMs / 1000) + 1)

    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      resetTime: now + config.windowMs
    }
  } catch (error) {
    console.error("[Redis Rate Limit] Error:", error instanceof Error ? error.message : error)
    // Fallback to in-memory on error
    return checkInMemoryRateLimit(identifier, config)
  }
}

/**
 * Clear rate limit in Redis
 */
async function clearRedisRateLimit(identifier: string): Promise<void> {
  const client = await getRedisClient()
  
  if (!client || !redisConnected) {
    clearInMemoryRateLimit(identifier)
    return
  }

  try {
    const key = `ratelimit:${identifier}`
    await client.del(key)
  } catch (error) {
    console.error("[Redis Rate Limit] Clear error:", error instanceof Error ? error.message : error)
    clearInMemoryRateLimit(identifier)
  }
}

/**
 * Distributed rate limit check
 * Uses Redis if available, falls back to in-memory
 */
export async function checkDistributedRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (USE_REDIS) {
    return checkRedisRateLimit(identifier, config)
  }
  return checkInMemoryRateLimit(identifier, config)
}

/**
 * Clear distributed rate limit
 */
export async function clearDistributedRateLimit(identifier: string): Promise<void> {
  if (USE_REDIS) {
    await clearRedisRateLimit(identifier)
  } else {
    clearInMemoryRateLimit(identifier)
  }
}

/**
 * Check if Redis is being used for rate limiting
 */
export function isRedisRateLimitingEnabled(): boolean {
  return USE_REDIS && redisConnected
}

/**
 * Get rate limiting status
 */
export function getRateLimitingStatus(): {
  type: "redis" | "memory"
  connected: boolean
  redisUrl: string | undefined
} {
  return {
    type: USE_REDIS ? "redis" : "memory",
    connected: USE_REDIS ? redisConnected : true,
    redisUrl: USE_REDIS ? REDIS_URL?.replace(/\/\/.*@/, "//***@") : undefined
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisConnected) {
    await redisClient.quit()
    redisConnected = false
    console.log("[Redis Rate Limit] Connection closed")
  }
}
