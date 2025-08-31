import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const latency = Date.now() - startTime
    console.log(`[API] GET /api/auth/me - 200 - ${latency}ms - User: ${user.id}`)

    return NextResponse.json({ user })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] GET /api/auth/me - Error:`, error)
    console.log(`[API] GET /api/auth/me - 500 - ${latency}ms`)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
