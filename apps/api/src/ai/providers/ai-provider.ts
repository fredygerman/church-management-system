/**
 * Provider-neutral chat types. The answer loop in ai.service.ts speaks only these;
 * each adapter translates them to one wire format (AI_API_FORMAT).
 */

export interface AiJsonSchema {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
  [key: string]: unknown
}

export interface AiToolSpec {
  name: string
  description: string
  inputSchema: AiJsonSchema
}

export interface AiToolCall {
  id: string
  name: string
  input: unknown
}

export interface AiToolOutcome {
  toolCallId: string
  content: string
  isError: boolean
}

export type AiMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text?: string; toolCalls: AiToolCall[] }
  | { role: 'tool'; outcomes: AiToolOutcome[] }

export interface AiCompletionRequest {
  model: string
  system: string
  tools: AiToolSpec[]
  messages: AiMessage[]
  maxTokens: number
}

export interface AiCompletion {
  text?: string
  toolCalls: AiToolCall[]
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletion>
}

export interface AiProviderConnection {
  apiKey: string
  baseUrl?: string
  apiSecret?: string
}

/** One request to the provider. Generous enough for a tool round, short enough to fail fast. */
export const AI_REQUEST_TIMEOUT_MS = 30_000

/** Error raised by an adapter. The message carries only the HTTP status, never the body or any secret. */
export class AiProviderError extends Error {
  constructor(readonly status: number) {
    super(`AI provider responded with HTTP ${status}`)
    this.name = 'AiProviderError'
  }
}
