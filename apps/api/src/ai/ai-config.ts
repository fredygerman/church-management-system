import { Logger, ServiceUnavailableException } from '@nestjs/common'
import type { AiProviderSettings, AiApiFormat } from './providers'

const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-5-5'
const FORMATS: readonly AiApiFormat[] = ['anthropic', 'openai']
const logger = new Logger('AiConfig')

/**
 * Reads the provider settings from the environment (set in Coolify, never in the repo).
 *
 * - AI_API_FORMAT: 'anthropic' (default) or 'openai' (any chat-completions compatible endpoint).
 * - AI_API_KEY: required. Sent as the bearer or x-api-key credential.
 * - AI_MODEL: model id. Defaults to claude-haiku-5-5 for anthropic; required for openai.
 * - AI_BASE_URL: optional endpoint override (default per format).
 * - AI_API_SECRET: optional second credential, sent as the x-api-secret header.
 *
 * Missing or invalid settings return 503 without a provider call. Only the variable
 * name is logged, never a value.
 */
export function loadAiSettings(env: NodeJS.ProcessEnv = process.env): AiProviderSettings {
  const formatRaw = env.AI_API_FORMAT?.trim() || 'anthropic'
  if (!(FORMATS as readonly string[]).includes(formatRaw)) {
    throw unavailable('AI_API_FORMAT must be anthropic or openai')
  }
  const format = formatRaw as AiApiFormat

  const apiKey = env.AI_API_KEY?.trim()
  if (!apiKey) throw unavailable('AI_API_KEY is missing')

  const model = env.AI_MODEL?.trim() || (format === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : '')
  if (!model) throw unavailable('AI_MODEL is missing')

  return {
    format,
    apiKey,
    model,
    baseUrl: env.AI_BASE_URL?.trim() || undefined,
    apiSecret: env.AI_API_SECRET?.trim() || undefined,
  }
}

function unavailable(reason: string): ServiceUnavailableException {
  logger.warn(`AI assistant not configured: ${reason}`)
  return new ServiceUnavailableException('AI assistant is not configured')
}
