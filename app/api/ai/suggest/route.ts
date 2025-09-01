import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse } from "@/lib/api-auth"
import { openai, isOpenAIAvailable } from "@/lib/openai"

const suggestSchema = z.object({
  type: z.enum(["description", "daily_plan"]),
  title: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { type, title } = suggestSchema.parse(body)

    if (type === "description") {
      if (!title) {
        return NextResponse.json({ error: "Title is required for description suggestions" }, { status: 400 })
      }

      let suggestion: string

      if (isOpenAIAvailable()) {
        try {
         const completion = await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that creates clear, actionable task descriptions. Responses must not repeat the task title. Write concise but comprehensive descriptions with well-structured steps, expected deliverables, and success criteria. Do not use markdown. Separate each step with a blank line for readability.",
            },
            {
              role: "user",
              content: `Generate a detailed description for this task: "${title}".`,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        });

          suggestion = completion.choices[0]?.message?.content?.trim() || "No suggestion available"
        } catch (error) {
          console.error("OpenAI API error:", error)
        }
      }

      const latency = Date.now() - startTime
      console.log(`[API] POST /api/ai/suggest (description) - 200 - ${latency}ms - User: ${user.id}`)

      return NextResponse.json({
        type: "description",
        title,
        suggestion,
        source: isOpenAIAvailable() ? "openai" : "none",
      })
    }

    return NextResponse.json({ error: "Invalid suggestion type" }, { status: 400 })
  } catch (error) {
    const latency = Date.now() - startTime
    console.error(`[API] POST /api/ai/suggest - Error:`, error)
    console.log(`[API] POST /api/ai/suggest - 500 - ${latency}ms`)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}