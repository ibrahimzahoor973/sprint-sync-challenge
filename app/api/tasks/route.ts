import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse } from "@/lib/api-auth"

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  totalMinutes: z.number().min(0).default(0),
  userId: z.string().optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  totalMinutes: z.number().min(0).optional(),
})

// GET /api/tasks - Get all tasks for current user (or all if admin)
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")


    const where: any = {}

    if (!user.isAdmin) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    // Filter by status if provided
    if (status && ["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      where.status = status
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const latency = Date.now() - startTime
    console.log(`[API] GET /api/tasks - 200 - ${latency}ms - User: ${user.id} - Tasks: ${tasks.length}`)

    return NextResponse.json({ tasks })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] GET /api/tasks - Error:`, error)
    console.log(`[API] GET /api/tasks - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { title, description, totalMinutes, userId } = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        title,
        description,
        totalMinutes,
        userId: userId || user.id,
        status: "TODO",
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
    console.log(`[API] POST /api/tasks - 201 - ${latency}ms - User: ${user.id} - Task: ${task.id}`)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] POST /api/tasks - Error:`, error)
    console.log(`[API] POST /api/tasks - 500 - ${latency}ms`)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
