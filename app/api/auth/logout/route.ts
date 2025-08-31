import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const response = NextResponse.json({
      message: "Logout successful",
    })

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    })

    const latency = Date.now() - startTime
    console.log(`[API] POST /api/auth/logout - 200 - ${latency}ms`)

    return response
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] POST /api/auth/logout - Error:`, error)
    console.log(`[API] POST /api/auth/logout - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
