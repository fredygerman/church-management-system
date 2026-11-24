import Anthropic from '@anthropic-ai/sdk'
import {
  AI_REQUEST_TIMEOUT_MS,
  type AiCompletion,
  type AiCompletionRequest,
  type AiMessage,
  type AiProvider,
  type AiProviderConnection,
} from './ai-provider'

/** Anthropic Messages API (AI_API_FORMAT=anthropic). */
export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic

  constructor(connection: AiProviderConnection) {
    this.client = new Anthropic({
      apiKey: connection.apiKey,
      baseURL: connection.baseUrl,
      timeout: AI_REQUEST_TIMEOUT_MS,
      defaultHeaders: connection.apiSecret ? { 'x-api-secret': connection.apiSecret } : undefined,
    })
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletion> {
    const response = await this.client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      system: request.system,
      tools: request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
      messages: request.messages.map(toAnthropicMessage),
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
    const toolCalls = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      .map((b) => ({ id: b.id, name: b.name, input: b.input }))
    return { text: text || undefined, toolCalls }
  }
}

function toAnthropicMessage(message: AiMessage): Anthropic.MessageParam {
  if (message.role === 'user') {
    return { role: 'user', content: message.text }
  }
  if (message.role === 'assistant') {
    const blocks: Anthropic.ContentBlockParam[] = []
    if (message.text) blocks.push({ type: 'text', text: message.text })
    for (const call of message.toolCalls) {
      blocks.push({ type: 'tool_use', id: call.id, name: call.name, input: call.input as Record<string, unknown> })
    }
    // Anthropic rejects an empty assistant turn; this only happens after an empty model reply.
    return { role: 'assistant', content: blocks.length > 0 ? blocks : [{ type: 'text', text: '(no answer)' }] }
  }
  return {
    role: 'user',
    content: message.outcomes.map((o) => ({
      type: 'tool_result' as const,
      tool_use_id: o.toolCallId,
      content: o.content,
      ...(o.isError ? { is_error: true } : {}),
    })),
  }
}
