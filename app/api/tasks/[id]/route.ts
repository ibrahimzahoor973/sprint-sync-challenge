import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/api-auth"

const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  totalMinutes: z.number().min(0).optional(),
  userId: z.string().optional(),
})

// GET /api/tasks/[id] - Get specific task
export async function GET(request: NextRequest, context: any) {
  const params = await context.params
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Non-admin users can only access their own tasks
    if (!user.isAdmin && task.userId !== user.id) {
      return createForbiddenResponse()
    }

    const latency = Date.now() - startTime
    console.log(`[API] GET /api/tasks/${params.id} - 200 - ${latency}ms - User: ${user.id}`)

    return NextResponse.json({ task })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] GET /api/tasks/${params.id} - Error:`, error)
    console.log(`[API] GET /api/tasks/${params.id} - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(request: NextRequest, context: any) {
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
    const updateData = updateTaskSchema.parse(body)

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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
    console.log(`[API] PUT /api/tasks/${params.id} - 200 - ${latency}ms - User: ${user.id}`)

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] PUT /api/tasks/${params.id} - Error:`, error)
    console.log(`[API] PUT /api/tasks/${params.id} - 500 - ${latency}ms`)

    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(", ")
      return NextResponse.json({ error: messages || 'Invalid Input', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, context: any) {
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

    // Non-admin users can only delete their own tasks
    if (!user.isAdmin && task.userId !== user.id) {
      return createForbiddenResponse()
    }

    await prisma.task.delete({
      where: { id: params.id },
    })

    const latency = Date.now() - startTime
    console.log(`[API] DELETE /api/tasks/${params.id} - 200 - ${latency}ms - User: ${user.id}`)

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] DELETE /api/tasks/${params.id} - Error:`, error)
    console.log(`[API] DELETE /api/tasks/${params.id} - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
