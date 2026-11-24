import { ServiceUnavailableException } from '@nestjs/common'
import { loadAiSettings } from './ai-config'

describe('loadAiSettings', () => {
  it('defaults to the anthropic format and claude-haiku-5-5', () => {
    expect(loadAiSettings({ AI_API_KEY: 'k' } as NodeJS.ProcessEnv)).toEqual({
      format: 'anthropic',
      apiKey: 'k',
      model: 'claude-haiku-5-5',
      baseUrl: undefined,
      apiSecret: undefined,
    })
  })

  it('reads every setting for an openai-format provider', () => {
    expect(
      loadAiSettings({
        AI_API_FORMAT: 'openai',
        AI_API_KEY: ' k ',
        AI_MODEL: 'm',
        AI_BASE_URL: ' https://x.test/v1 ',
        AI_API_SECRET: 's',
      } as NodeJS.ProcessEnv),
    ).toEqual({ format: 'openai', apiKey: 'k', model: 'm', baseUrl: 'https://x.test/v1', apiSecret: 's' })
  })

  it('rejects an unknown format', () => {
    expect(() => loadAiSettings({ AI_API_KEY: 'k', AI_API_FORMAT: 'gemini' } as NodeJS.ProcessEnv)).toThrow(
      ServiceUnavailableException,
    )
  })

  it('requires AI_MODEL for the openai format', () => {
    expect(() => loadAiSettings({ AI_API_KEY: 'k', AI_API_FORMAT: 'openai' } as NodeJS.ProcessEnv)).toThrow(
      ServiceUnavailableException,
    )
  })

  it('requires AI_API_KEY and does not echo it in the error', () => {
    let caught: unknown
    try {
      loadAiSettings({ AI_API_KEY: '   ' } as NodeJS.ProcessEnv)
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(ServiceUnavailableException)
    expect(JSON.stringify((caught as ServiceUnavailableException).getResponse())).not.toContain('AI_API_KEY')
  })
})
