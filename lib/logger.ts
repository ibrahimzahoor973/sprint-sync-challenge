interface LogContext {
  userId?: string
  method?: string
  path?: string
  statusCode?: number
  latency?: number
  userAgent?: string
  ip?: string
  error?: Error
  [key: string]: any
}

export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString()
  }

  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = this.formatTimestamp()
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ""
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  static info(message: string, context?: LogContext): void {
    console.log(this.formatMessage("info", message, context))
  }

  static warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context))
  }

  static error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context

    console.error(this.formatMessage("error", message, errorContext))
  }

  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, context))
    }
  }

  static apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      type: "api_request",
      ...context,
    })
  }

  static apiResponse(method: string, path: string, statusCode: number, latency: number, context?: LogContext): void {
    const level = statusCode >= 400 ? "warn" : "info"
    const message = `API Response: ${method} ${path} - ${statusCode} - ${latency}ms`

    if (level === "warn") {
      this.warn(message, {
        method,
        path,
        statusCode,
        latency,
        type: "api_response",
        ...context,
      })
    } else {
      this.info(message, {
        method,
        path,
        statusCode,
        latency,
        type: "api_response",
        ...context,
      })
    }
  }

  static authEvent(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth Event: ${event}`, {
      event,
      userId,
      type: "auth_event",
      ...context,
    })
  }

  static dbQuery(query: string, duration?: number, context?: LogContext): void {
    this.debug(`DB Query: ${query}`, {
      query,
      duration,
      type: "db_query",
      ...context,
    })
  }

  static aiRequest(type: string, userId: string, context?: LogContext): void {
    this.info(`AI Request: ${type}`, {
      type: "ai_request",
      aiType: type,
      userId,
      ...context,
    })
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static recordLatency(endpoint: string, latency: number): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, [])
    }

    const latencies = this.metrics.get(endpoint)!
    latencies.push(latency)

    // Keep only last 100 measurements per endpoint
    if (latencies.length > 100) {
      latencies.shift()
    }
  }

  static getAverageLatency(endpoint: string): number {
    const latencies = this.metrics.get(endpoint)
    if (!latencies || latencies.length === 0) return 0

    return latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
  }

  static getMetricsSummary(): Record<string, { avg: number; count: number; max: number; min: number }> {
    const summary: Record<string, { avg: number; count: number; max: number; min: number }> = {}

    for (const [endpoint, latencies] of this.metrics.entries()) {
      if (latencies.length > 0) {
        summary[endpoint] = {
          avg: Math.round(latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length),
          count: latencies.length,
          max: Math.max(...latencies),
          min: Math.min(...latencies),
        }
      }
    }

    return summary
  }

  static logPerformanceSummary(): void {
    const summary = this.getMetricsSummary()
    Logger.info("Performance Summary", { metrics: summary, type: "performance_summary" })
  }
}

// Error tracking
export class ErrorTracker {
  private static errorCounts: Map<string, number> = new Map()

  static trackError(error: Error, context?: LogContext): void {
    const errorKey = `${error.name}:${error.message}`
    const currentCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, currentCount + 1)

    Logger.error("Application Error", error, {
      ...context,
      errorCount: currentCount + 1,
      type: "tracked_error",
    })
  }

  static getErrorSummary(): Record<string, number> {
    return Object.fromEntries(this.errorCounts.entries())
  }

  static logErrorSummary(): void {
    const summary = this.getErrorSummary()
    if (Object.keys(summary).length > 0) {
      Logger.warn("Error Summary", { errors: summary, type: "error_summary" })
    }
  }
}
