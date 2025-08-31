import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { email, password } = registerSchema.parse(body)

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
        isAdmin: false,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    })

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user,
      message: "User registered successfully",
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
    })

    const latency = Date.now() - startTime
    console.log(`[API] POST /api/auth/register - ${response.status} - ${latency}ms`)

    return response
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] POST /api/auth/register - Error:`, error)
    console.log(`[API] POST /api/auth/register - 500 - ${latency}ms`)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
