import {
  AI_REQUEST_TIMEOUT_MS,
  AiProviderError,
  type AiCompletion,
  type AiCompletionRequest,
  type AiMessage,
  type AiProvider,
  type AiProviderConnection,
} from './ai-provider'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'

interface ChatCompletionResponse {
  choices?: {
    message?: {
      content?: string | null
      tool_calls?: { id: string; function: { name: string; arguments: string } }[]
    }
  }[]
}

/**
 * OpenAI chat-completions wire format (AI_API_FORMAT=openai). Works with any
 * endpoint that speaks it, set with AI_BASE_URL (for example a gateway or a
 * compatible hosted provider).
 */
export class OpenAiCompatibleProvider implements AiProvider {
  constructor(private readonly connection: AiProviderConnection) {}

  async complete(request: AiCompletionRequest): Promise<AiCompletion> {
    const base = (this.connection.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      authorization: `Bearer ${this.connection.apiKey}`,
    }
    if (this.connection.apiSecret) headers['x-api-secret'] = this.connection.apiSecret

    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens,
        messages: [
          { role: 'system', content: request.system },
          ...request.messages.flatMap(toOpenAiMessages),
        ],
        tools: request.tools.map((t) => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.inputSchema },
        })),
      }),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new AiProviderError(response.status)
    }

    const body = (await response.json()) as ChatCompletionResponse
    const message = body.choices?.[0]?.message
    if (!message) {
      throw new AiProviderError(200)
    }
    return {
      text: message.content || undefined,
      toolCalls: (message.tool_calls ?? []).map((call) => ({
        id: call.id,
        name: call.function.name,
        input: parseArguments(call.function.arguments),
      })),
    }
  }
}

function toOpenAiMessages(message: AiMessage): object[] {
  if (message.role === 'user') {
    return [{ role: 'user', content: message.text }]
  }
  if (message.role === 'assistant') {
    if (message.toolCalls.length === 0) {
      return [{ role: 'assistant', content: message.text ?? '' }]
    }
    return [
      {
        role: 'assistant',
        content: message.text ?? null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: JSON.stringify(call.input ?? {}) },
        })),
      },
    ]
  }
  // This format has no is_error flag, so errors are marked in the text.
  return message.outcomes.map((o) => ({
    role: 'tool',
    tool_call_id: o.toolCallId,
    content: o.isError ? `ERROR: ${o.content}` : o.content,
  }))
}

/** Malformed arguments become an empty object, which the caller's validation rejects. */
function parseArguments(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}
