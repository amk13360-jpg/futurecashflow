/**
 * Azure Monitor / Application Insights Integration
 * Provides centralized logging for security events, errors, and telemetry
 * 
 * Configuration:
 * - APPLICATIONINSIGHTS_CONNECTION_STRING: Azure Application Insights connection string
 * - AZURE_MONITOR_ENABLED: Set to "true" to enable Azure Monitor
 * 
 * Optional dependency: npm install applicationinsights
 */

// Type definitions for applicationinsights (to avoid build errors when not installed)
interface AppInsightsClient {
  trackEvent(telemetry: { name: string; properties?: Record<string, string | undefined> }): void
  trackMetric(telemetry: { name: string; value: number }): void
  trackException(telemetry: { exception: Error; properties?: Record<string, string | undefined> }): void
  flush(options?: { callback?: () => void }): void
}

interface AppInsightsModule {
  setup(connectionString: string): AppInsightsModule
  setAutoCollectRequests(value: boolean): AppInsightsModule
  setAutoCollectPerformance(value: boolean, extended?: boolean): AppInsightsModule
  setAutoCollectExceptions(value: boolean): AppInsightsModule
  setAutoCollectDependencies(value: boolean): AppInsightsModule
  setAutoCollectConsole(value: boolean, collectConsoleLogs?: boolean): AppInsightsModule
  setUseDiskRetryCaching(value: boolean): AppInsightsModule
  setSendLiveMetrics(value: boolean): AppInsightsModule
  start(): void
  defaultClient: AppInsightsClient | null
}

// Cached module reference
let appInsightsModule: AppInsightsModule | null = null
let moduleLoadAttempted = false

export interface SecurityLogEvent {
  eventType: "authentication" | "authorization" | "rate_limit" | "security_violation" | "audit"
  action: string
  userId?: number
  userType?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  outcome: "success" | "failure" | "blocked"
  details?: Record<string, unknown>
  severity: "info" | "warning" | "error" | "critical"
}

export interface ErrorLogEvent {
  error: Error | string
  context?: string
  userId?: number
  requestPath?: string
  requestMethod?: string
  statusCode?: number
  stack?: string
}

// Azure Monitor configuration
const AZURE_MONITOR_ENABLED = process.env.AZURE_MONITOR_ENABLED === "true"
const APPINSIGHTS_CONNECTION_STRING = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

// In-memory buffer for batch sending (if needed)
const logBuffer: Array<{ timestamp: Date; event: SecurityLogEvent | ErrorLogEvent }> = []
const MAX_BUFFER_SIZE = 100

/**
 * Get Application Insights module (lazy loaded)
 */
function getAppInsights(): AppInsightsModule | null {
  if (moduleLoadAttempted) {
    return appInsightsModule
  }
  
  moduleLoadAttempted = true
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    appInsightsModule = require("applicationinsights") as AppInsightsModule
    return appInsightsModule
  } catch {
    // Package not installed - this is expected in development
    return null
  }
}

/**
 * Initialize Azure Monitor (call once at startup)
 */
export async function initializeAzureMonitor(): Promise<void> {
  if (!AZURE_MONITOR_ENABLED || !APPINSIGHTS_CONNECTION_STRING) {
    console.log("[Azure Monitor] Disabled or not configured")
    return
  }

  try {
    const appInsights = getAppInsights()
    
    if (!appInsights) {
      console.warn("[Azure Monitor] applicationinsights package not installed")
      return
    }
    
    appInsights.setup(APPINSIGHTS_CONNECTION_STRING)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start()

    console.log("[Azure Monitor] Initialized successfully")
  } catch (error) {
    console.warn("[Azure Monitor] Failed to initialize:", error instanceof Error ? error.message : error)
  }
}

/**
 * Log a security event to Azure Monitor
 */
export async function logSecurityEvent(event: SecurityLogEvent): Promise<void> {
  const timestamp = new Date()
  
  // Always log to console for local debugging
  const consoleMethod = event.severity === "critical" || event.severity === "error" 
    ? console.error 
    : event.severity === "warning" 
    ? console.warn 
    : console.log
  
  consoleMethod(`[Security] ${event.action}`, {
    ...event,
    timestamp: timestamp.toISOString()
  })

  if (!AZURE_MONITOR_ENABLED) {
    return
  }

  try {
    const appInsights = getAppInsights()
    const client = appInsights?.defaultClient

    if (client) {
      client.trackEvent({
        name: `Security.${event.eventType}.${event.action}`,
        properties: {
          eventType: event.eventType,
          action: event.action,
          userId: event.userId?.toString(),
          userType: event.userType,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          resource: event.resource,
          outcome: event.outcome,
          severity: event.severity
        }
      })

      // Track as metric for dashboards
      client.trackMetric({
        name: `Security.${event.eventType}.${event.outcome}`,
        value: 1
      })
    }
  } catch {
    // Silently fail if App Insights not available
    logBuffer.push({ timestamp, event })
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift() // Remove oldest
    }
  }
}

/**
 * Log an error to Azure Monitor
 */
export async function logError(event: ErrorLogEvent): Promise<void> {
  const timestamp = new Date()
  const errorMessage = event.error instanceof Error ? event.error.message : String(event.error)
  const errorStack = event.error instanceof Error ? event.error.stack : event.stack
  
  console.error(`[Error] ${event.context || "Unknown"}:`, errorMessage)

  if (!AZURE_MONITOR_ENABLED) {
    return
  }

  try {
    const appInsights = getAppInsights()
    const client = appInsights?.defaultClient

    if (client) {
      const error = event.error instanceof Error 
        ? event.error 
        : new Error(String(event.error))

      client.trackException({
        exception: error,
        properties: {
          context: event.context,
          userId: event.userId?.toString(),
          requestPath: event.requestPath,
          requestMethod: event.requestMethod,
          statusCode: event.statusCode?.toString()
        }
      })
    }
  } catch {
    // Silently fail
  }
}

/**
 * Log authentication event helper
 */
export async function logAuthEvent(
  action: "login" | "logout" | "failed_login" | "password_change" | "2fa_setup" | "2fa_verify",
  outcome: "success" | "failure",
  details: {
    userId?: number
    userType?: string
    ipAddress?: string
    userAgent?: string
    reason?: string
  }
): Promise<void> {
  await logSecurityEvent({
    eventType: "authentication",
    action,
    outcome,
    severity: outcome === "failure" ? "warning" : "info",
    ...details,
    details: { reason: details.reason }
  })
}

/**
 * Log authorization event helper
 */
export async function logAuthzEvent(
  action: "access_granted" | "access_denied" | "role_check",
  outcome: "success" | "failure",
  details: {
    userId?: number
    userType?: string
    resource?: string
    ipAddress?: string
    reason?: string
  }
): Promise<void> {
  await logSecurityEvent({
    eventType: "authorization",
    action,
    outcome,
    severity: outcome === "failure" ? "warning" : "info",
    ...details,
    details: { reason: details.reason }
  })
}

/**
 * Log rate limiting event helper
 */
export async function logRateLimitEvent(
  ipAddress: string,
  endpoint: string,
  blocked: boolean
): Promise<void> {
  await logSecurityEvent({
    eventType: "rate_limit",
    action: blocked ? "blocked" : "allowed",
    outcome: blocked ? "blocked" : "success",
    severity: blocked ? "warning" : "info",
    ipAddress,
    resource: endpoint
  })
}

/**
 * Log security violation helper
 */
export async function logSecurityViolation(
  violation: "csrf" | "xss" | "injection" | "session_hijack" | "brute_force" | "suspicious_activity",
  details: {
    ipAddress?: string
    userAgent?: string
    userId?: number
    resource?: string
    payload?: string
  }
): Promise<void> {
  await logSecurityEvent({
    eventType: "security_violation",
    action: violation,
    outcome: "blocked",
    severity: "critical",
    ...details,
    details: { payload: details.payload }
  })
}

/**
 * Create audit log entry (database + Azure Monitor)
 */
export async function createSecurityAuditLog(
  action: string,
  details: {
    userId?: number
    userType?: "admin" | "accounts_payable" | "supplier" | "system"
    entityType?: string
    entityId?: number
    description?: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  // Log to Azure Monitor
  await logSecurityEvent({
    eventType: "audit",
    action,
    outcome: "success",
    severity: "info",
    userId: details.userId,
    userType: details.userType,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    resource: details.entityType ? `${details.entityType}:${details.entityId}` : undefined,
    details: { description: details.description }
  })

  // Also log to database via existing audit function
  try {
    const { createAuditLog } = await import("@/lib/auth/audit")
    await createAuditLog({
      userId: details.userId,
      userType: details.userType || "system",
      action,
      entityType: details.entityType,
      entityId: details.entityId,
      details: details.description,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    })
  } catch (error) {
    console.error("[Audit] Failed to write to database:", error)
  }
}

/**
 * Flush any buffered logs (call before shutdown)
 */
export async function flushLogs(): Promise<void> {
  if (!AZURE_MONITOR_ENABLED) {
    return
  }

  try {
    const appInsights = getAppInsights()
    const client = appInsights?.defaultClient
    
    if (client) {
      await new Promise<void>((resolve) => {
        client.flush({
          callback: () => resolve()
        })
      })
    }
  } catch {
    // Silently fail
  }
}
