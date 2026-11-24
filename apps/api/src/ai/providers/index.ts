import { AnthropicProvider } from './anthropic-provider'
import type { AiProvider } from './ai-provider'
import { OpenAiCompatibleProvider } from './openai-compatible-provider'

export type AiApiFormat = 'anthropic' | 'openai'

export interface AiProviderSettings {
  format: AiApiFormat
  apiKey: string
  model: string
  baseUrl?: string
  apiSecret?: string
}

export function createAiProvider(settings: AiProviderSettings): AiProvider {
  const connection = { apiKey: settings.apiKey, baseUrl: settings.baseUrl, apiSecret: settings.apiSecret }
  return settings.format === 'anthropic'
    ? new AnthropicProvider(connection)
    : new OpenAiCompatibleProvider(connection)
}

export * from './ai-provider'
