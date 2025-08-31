import OpenAI from "openai"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export { openai }

export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY && !!openai
}
