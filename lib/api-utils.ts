import type { NextRequest, NextResponse } from "next/server"
import { Logger, PerformanceMonitor, ErrorTracker } from "./logger"

export function withLogging<T extends any[]>(handler: (...args: T) => Promise<Response>, endpoint: string) {
  return async (...args: T): Promise<Response> => {
    const startTime = Date.now()
    let response: Response
    let error: Error | null = null

    try {
      response = await handler(...args)
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
      ErrorTracker.trackError(error, { endpoint })

      response = Response.json({ error: "Internal server error" }, { status: 500 })
    }

    const latency = Date.now() - startTime
    PerformanceMonitor.recordLatency(endpoint, latency)

    // Extract request info if available
    const request = args[0] as NextRequest
    const userId = request?.headers?.get("x-user-id") || "anonymous"

    Logger.apiResponse(request?.method || "UNKNOWN", endpoint, response.status, latency, {
      userId: userId !== "anonymous" ? userId : undefined,
      error: error ? { name: error.name, message: error.message } : undefined,
    })

    return response
  }
}

export async function logApiCall(request: NextRequest, response: NextResponse, startTime: number) {
  const latency = Date.now() - startTime
  const userId = request.headers.get("x-user-id") || undefined
  const method = request.method
  const pathname = new URL(request.url).pathname

  PerformanceMonitor.recordLatency(pathname, latency)

  Logger.apiResponse(method, pathname, response.status, latency, {
    userId: userId !== "anonymous" ? userId : undefined,
  })
}
