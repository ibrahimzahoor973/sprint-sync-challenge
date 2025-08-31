import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/api-auth"

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  isAdmin: z.boolean().optional(),
})

// GET /api/users/[id] - Get specific user (admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return createUnauthorizedResponse()
    }

    if (!currentUser.isAdmin) {
      return createForbiddenResponse()
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const latency = Date.now() - startTime
    console.log(`[API] GET /api/users/${params.id} - 200 - ${latency}ms - Admin: ${currentUser.id}`)

    return NextResponse.json({ user })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] GET /api/users/${params.id} - Error:`, error)
    console.log(`[API] GET /api/users/${params.id} - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return createUnauthorizedResponse()
    }

    if (!currentUser.isAdmin) {
      return createForbiddenResponse()
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData = updateUserSchema.parse(body)

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email already taken" }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const latency = Date.now() - startTime
    console.log(`[API] PUT /api/users/${params.id} - 200 - ${latency}ms - Admin: ${currentUser.id}`)

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] PUT /api/users/${params.id} - Error:`, error)
    console.log(`[API] PUT /api/users/${params.id} - 500 - ${latency}ms`)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return createUnauthorizedResponse()
    }

    if (!currentUser.isAdmin) {
      return createForbiddenResponse()
    }

    // Prevent admin from deleting themselves
    if (currentUser.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user (tasks will be cascade deleted due to schema)
    await prisma.user.delete({
      where: { id: params.id },
    })

    const latency = Date.now() - startTime
    console.log(`[API] DELETE /api/users/${params.id} - 200 - ${latency}ms - Admin: ${currentUser.id}`)

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] DELETE /api/users/${params.id} - Error:`, error)
    console.log(`[API] DELETE /api/users/${params.id} - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
