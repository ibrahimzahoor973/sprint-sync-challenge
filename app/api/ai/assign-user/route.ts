import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createUnauthorizedResponse } from "@/lib/api-auth"
import { openai, isOpenAIAvailable } from "@/lib/openai"
import { OpenAIEmbeddings } from "@langchain/openai"
import { isPineconeAvailable, getPineconeStore, pineconeIndex } from "@/lib/pinecone"

const assignUserSchema = z.object({
  description: z.string()
})

async function pineconeSimilaritySearch(query: string, k: number, filter?: Record<string, any>) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const vectorStore = getPineconeStore(embeddings)
  const results = await vectorStore.similaritySearch(query, k, filter)
  return results
}

// Generation step => Use LLM to pick the best candidate from retrieved docs
async function generateBestCandidate(taskDescription: string, docs: any[]) {
  if (!openai) return null

  const resumeSnippets = docs.map((doc, idx) => 
    `Candidate ${idx + 1}:\nName: ${doc.metadata?.name}:\nEmail: ${doc.metadata?.email}\nResume: ${doc.pageContent}`
  ).join("\n\n")

  console.log({
    taskDescription,
    resumeSnippets
  })

const prompt = `
  You are an expert recruiter.

  Given the following candidate resumes and the task description, choose the top 3 most suitable candidates at max from Candidate Resumes.
  If no candidates are suitable, return an empty list.
  If less than 3 candidates are suitable, return only those that are suitable.
  Return ONLY a valid JSON array of their emails in this format:
  [
    {"email": "user1@gmail.com"},
    {"email": "user2@gmail.com"},
    {"email": "user3@gmail.com"}
  ]

  Task Description:
  ${taskDescription}

  Candidate Resumes:
  ${resumeSnippets}
`;


  const response = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are an expert recruiter." },
      { role: "user", content: prompt }
    ],
    model: "gpt-3.5-turbo",
    max_tokens: 100,
    temperature: 0.2,
  })

  console.log("LLM Response:", response.choices?.[0]?.message?.content?.trim())

  return response.choices?.[0]?.message?.content?.trim() || null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { description } = assignUserSchema.parse(body)

    if (!description) {
      return NextResponse.json({ error: "Description is required for assigning user" }, { status: 400 })
    }

    let suggestedUsers: [string] | [] = []

    if (isPineconeAvailable() && isOpenAIAvailable()) {
      try {
        const results = await pineconeSimilaritySearch(description, 5)
        if (results.length > 0) {
          const bestUsers = await generateBestCandidate(description, results) || ""
          console.log({ bestUsers })

          let emailList: string[] = []
          try {
            const jsonString = bestUsers.replace(/```json|```/g, "").trim()
            const parsed = JSON.parse(jsonString)
            if (Array.isArray(parsed)) {
              emailList = parsed
                .map((item: any) => typeof item === "object" && item.email ? item.email : null)
                .filter((email: string | null) => typeof email === "string")
            }
          } catch (e) {
            console.error("Failed to parse LLM response for emails:", e)
          }

          // const suggestedUsers = results.filter(doc => emailList.includes(doc.metadata?.email))

          const suggestedUsers = emailList;

          const latency = Date.now() - startTime
          console.log(`[API] POST /api/ai/suggest (Pinecone+LLM) - 200 - ${latency}ms - User: ${user.id} - Suggested Users: ${emailList}`)

          return NextResponse.json({
            suggestion: suggestedUsers,
            source: "pinecone+llm",
          })
        } else {
          console.log("No similar users found in Pinecone, falling back to OpenAI only.")
        }
      } catch (error) {
        console.error("Error during Pinecone similarity search or LLM generation:", error)
      }
    }

    const latency = Date.now() - startTime
    console.log(`[API] POST /api/ai/suggest (description) - 200 - ${latency}ms - User: ${user.id}`)

    return NextResponse.json({
      suggestion: suggestedUsers,
      source: isOpenAIAvailable() ? "openai" : "fallback",
    })
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