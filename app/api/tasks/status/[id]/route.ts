import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/api-auth"

const statusUpdateSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
})

// PATCH /api/tasks/status/[id] - Update task status
export async function PATCH(request: NextRequest, context: any) {
  const params = await context.params
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Non-admin users can only update their own tasks
    if (!user.isAdmin && task.userId !== user.id) {
      return createForbiddenResponse()
    }

    const body = await request.json()
    const { status } = statusUpdateSchema.parse(body)

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    const latency = Date.now() - startTime
    console.log(
      `[API] PATCH /api/tasks/status/${params.id} - 200 - ${latency}ms - User: ${user.id} - Status: ${status}`,
    )

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] PATCH /api/tasks/status/${params.id} - Error:`, error)
    console.log(`[API] PATCH /api/tasks/status/${params.id} - 500 - ${latency}ms`)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks/status/[id] - Cycle task status (TODO → IN_PROGRESS → DONE → TODO)
export async function POST(request: NextRequest, context: any) {
  const params = await context.params
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Non-admin users can only update their own tasks
    if (!user.isAdmin && task.userId !== user.id) {
      return createForbiddenResponse()
    }

    // Cycle through statuses
    let nextStatus: "TODO" | "IN_PROGRESS" | "DONE"
    switch (task.status) {
      case "TODO":
        nextStatus = "IN_PROGRESS"
        break
      case "IN_PROGRESS":
        nextStatus = "DONE"
        break
      case "DONE":
        nextStatus = "TODO"
        break
      default:
        nextStatus = "TODO"
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: nextStatus,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    const latency = Date.now() - startTime
    console.log(
      `[API] POST /api/tasks/status/${params.id} - 200 - ${latency}ms - User: ${user.id} - Status: ${task.status} → ${nextStatus}`,
    )

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] POST /api/tasks/status/${params.id} - Error:`, error)
    console.log(`[API] POST /api/tasks/status/${params.id} - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
