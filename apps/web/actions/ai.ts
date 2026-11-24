"use server"

import { validateAiResponse, type AiComponent } from "@church/config"

import { apiRequest } from "@/lib/api-client"

interface AiChatPayload {
  conversationId?: string
  components?: unknown
}

export type AiSendResult =
  | { status: "ok"; conversationId: string; components: AiComponent[] }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }

const UNAVAILABLE_MESSAGE = "AI is not available right now."
const ERROR_MESSAGE = "The assistant could not answer. Please try again."

function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT")
}

export async function sendAiMessage(
  churchId: string,
  message: string,
  conversationId?: string
): Promise<AiSendResult> {
  try {
    const response = await apiRequest<AiChatPayload>({
      requestConfig: {
        method: "POST",
        url: "/ai/chat",
        data: { churchId, message, conversationId },
      },
    })

    // 503 means the API has no AI provider configured (DEC-08).
    if (response.statusCode === 503) {
      return { status: "unavailable", message: UNAVAILABLE_MESSAGE }
    }

    if (!response.success) {
      return { status: "error", message: ERROR_MESSAGE }
    }

    const payload = response.data
    if (typeof payload?.conversationId !== "string" || payload.conversationId.length === 0) {
      return { status: "unavailable", message: UNAVAILABLE_MESSAGE }
    }

    // Never render unvalidated AI output: an invalid answer is treated as unavailable.
    const validated = validateAiResponse({ components: payload.components })
    if (!validated.ok) {
      console.error("AI response failed validation:", validated.errors)
      return { status: "unavailable", message: UNAVAILABLE_MESSAGE }
    }

    return {
      status: "ok",
      conversationId: payload.conversationId,
      components: validated.value.components,
    }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }

    console.error("Error sending AI message:", error)
    return { status: "error", message: ERROR_MESSAGE }
  }
}
