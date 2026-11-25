"use server"

import { validateAiResponse, type AiComponent, type AiSource } from "@church/config"

import { apiRequest } from "@/lib/api-client"
import { getTranslator } from "@/lib/i18n/server"

interface AiChatPayload {
  conversationId?: string
  components?: unknown
  sources?: unknown
  uncertain?: unknown
}

export type AiSendResult =
  | { status: "ok"; conversationId: string; components: AiComponent[]; sources: AiSource[]; uncertain: boolean }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }

// validateAiResponse only checks components, so sources and uncertain are read here, as plain titles.
function readSources(value: unknown): AiSource[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => (item && typeof item.title === "string" && item.title.length > 0 ? [{ title: item.title }] : []))
}

function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT")
}

export async function sendAiMessage(
  churchId: string,
  message: string,
  conversationId?: string
): Promise<AiSendResult> {
  const t = await getTranslator()
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
      return { status: "unavailable", message: t("final.ai.unavailable") }
    }

    if (!response.success) {
      return { status: "error", message: t("final.ai.error") }
    }

    const payload = response.data
    if (typeof payload?.conversationId !== "string" || payload.conversationId.length === 0) {
      return { status: "unavailable", message: t("final.ai.unavailable") }
    }

    // Never render unvalidated AI output: an invalid answer is treated as unavailable.
    const validated = validateAiResponse({ components: payload.components })
    if (!validated.ok) {
      console.error("AI response failed validation:", validated.errors)
      return { status: "unavailable", message: t("final.ai.unavailable") }
    }

    return {
      status: "ok",
      conversationId: payload.conversationId,
      components: validated.value.components,
      sources: readSources(payload.sources),
      uncertain: payload.uncertain === true,
    }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }

    console.error("Error sending AI message:", error)
    return { status: "error", message: t("final.ai.error") }
  }
}
