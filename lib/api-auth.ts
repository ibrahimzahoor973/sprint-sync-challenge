import type { NextRequest } from "next/server"
import { getUserFromToken } from "./auth"

export async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    return null
  }

  return await getUserFromToken(token)
}

export function createUnauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}

export function createForbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 })
}
