import { NextResponse } from "next/server"
import { Logger, PerformanceMonitor, ErrorTracker } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    const latency = Date.now() - startTime
    const performanceMetrics = PerformanceMonitor.getMetricsSummary()
    const errorSummary = ErrorTracker.getErrorSummary()

    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      latency: `${latency}ms`,
      performance: performanceMetrics,
      errors: errorSummary,
      environment: process.env.NODE_ENV,
      version: "1.0.0",
    }

    Logger.info("Health check completed", {
      type: "health_check",
      latency,
      status: "healthy",
    })

    return NextResponse.json(healthData)
  } catch (error) {
    const latency = Date.now() - startTime

    Logger.error("Health check failed", error as Error, {
      type: "health_check",
      latency,
      status: "unhealthy",
    })

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        latency: `${latency}ms`,
      },
      { status: 503 },
    )
  }
}
