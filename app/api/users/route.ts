import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/api-auth"
import { hashPassword } from "@/lib/auth"

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().default(false),
})

// GET /api/users - Get all users (for admin only)
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    if (!user.isAdmin) {
      return createForbiddenResponse()
    }

    const where: any = {
      NOT: { id: user.id },
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const latency = Date.now() - startTime
    console.log(`[API] GET /api/users - 200 - ${latency}ms - Admin: ${user.id} - Users: ${users.length}`)

    return NextResponse.json({ users })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] GET /api/users - Error:`, error)
    console.log(`[API] GET /api/users - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return createUnauthorizedResponse()
    }

    if (!currentUser.isAdmin) {
      return createForbiddenResponse()
    }

    const body = await request.json()
    const { email, password, isAdmin } = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Create new user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isAdmin,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const latency = Date.now() - startTime
    console.log(`[API] POST /api/users - 201 - ${latency}ms - Admin: ${currentUser.id} - NewUser: ${user.id}`)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] POST /api/users - Error:`, error)
    console.log(`[API] POST /api/users - 500 - ${latency}ms`)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
