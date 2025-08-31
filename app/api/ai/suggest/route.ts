import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse } from "@/lib/api-auth"
import { openai, isOpenAIAvailable } from "@/lib/openai"

const suggestSchema = z.object({
  type: z.enum(["description", "daily_plan"]),
  title: z.string().optional(),
})

const fallbackDescriptions = {
  setup:
    "Initialize the project structure, configure necessary dependencies, and prepare the development environment for optimal workflow.",
  design:
    "Create wireframes and mockups, define the user interface components, and establish the visual design system for consistency.",
  implement:
    "Write the core functionality, integrate required APIs, and ensure proper error handling and validation throughout the system.",
  test: "Develop comprehensive test cases, perform unit and integration testing, and validate all features work as expected.",
  deploy:
    "Configure production environment, set up CI/CD pipeline, and ensure the application is ready for live deployment.",
  review:
    "Conduct thorough code review, check for security vulnerabilities, and optimize performance for better user experience.",
  fix: "Identify and resolve bugs, address user feedback, and implement necessary improvements to enhance functionality.",
  optimize:
    "Analyze performance metrics, refactor inefficient code, and implement caching strategies for better system performance.",
  document:
    "Create comprehensive documentation, write user guides, and ensure all code is properly commented for maintainability.",
  meeting:
    "Prepare agenda items, gather necessary materials, and coordinate with team members to ensure productive discussion.",
}

function generateFallbackDescription(title: string): string {
  const lowerTitle = title.toLowerCase()

  for (const [keyword, description] of Object.entries(fallbackDescriptions)) {
    if (lowerTitle.includes(keyword)) {
      return description
    }
  }

  return "Break this task into smaller, actionable steps. Define clear success criteria and identify any dependencies or resources needed to complete this work effectively."
}

// POST /api/ai/suggest - Get AI suggestions
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

          suggestion = completion.choices[0]?.message?.content || generateFallbackDescription(title)
        } catch (error) {
          console.error("OpenAI API error:", error)
          suggestion = generateFallbackDescription(title)
        }
      } else {
        suggestion = generateFallbackDescription(title)
      }

      const latency = Date.now() - startTime
      console.log(`[API] POST /api/ai/suggest (description) - 200 - ${latency}ms - User: ${user.id}`)

      return NextResponse.json({
        type: "description",
        title,
        suggestion,
        source: isOpenAIAvailable() ? "openai" : "fallback",
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