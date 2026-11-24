import { OpenAiCompatibleProvider } from './openai-compatible-provider'
import { AnthropicProvider } from './anthropic-provider'

const SCHEMA = { type: 'object' as const, properties: {} }

function okResponse(message: object) {
  return new Response(JSON.stringify({ choices: [{ message }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('OpenAiCompatibleProvider', () => {
  afterEach(() => jest.restoreAllMocks())

  it('maps a tool round to tool_calls and tool messages, and parses the reply', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      okResponse({
        content: 'Checking',
        tool_calls: [{ id: 'c2', function: { name: 'member_count', arguments: '{}' } }],
      }),
    )
    const provider = new OpenAiCompatibleProvider({ apiKey: 'k' })

    const completion = await provider.complete({
      model: 'm',
      system: 'sys',
      maxTokens: 10,
      tools: [{ name: 'member_count', description: 'count', inputSchema: SCHEMA }],
      messages: [
        { role: 'user', text: 'how many?' },
        { role: 'assistant', toolCalls: [{ id: 'c1', name: 'member_count', input: {} }] },
        {
          role: 'tool',
          outcomes: [
            { toolCallId: 'c1', content: '{"error":"permission_denied"}', isError: true },
          ],
        },
      ],
    })

    expect(completion).toEqual({
      text: 'Checking',
      toolCalls: [{ id: 'c2', name: 'member_count', input: {} }],
    })
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'how many?' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [{ id: 'c1', type: 'function', function: { name: 'member_count', arguments: '{}' } }],
      },
      { role: 'tool', tool_call_id: 'c1', content: 'ERROR: {"error":"permission_denied"}' },
    ])
    expect(body.tools[0]).toEqual({
      type: 'function',
      function: { name: 'member_count', description: 'count', parameters: SCHEMA },
    })
  })

  it('treats malformed tool arguments as an empty object', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      okResponse({ tool_calls: [{ id: 'c1', function: { name: 'respond', arguments: '{not json' } }] }),
    )
    const provider = new OpenAiCompatibleProvider({ apiKey: 'k' })

    const completion = await provider.complete({
      model: 'm',
      system: 's',
      maxTokens: 10,
      tools: [],
      messages: [{ role: 'user', text: 'hi' }],
    })

    expect(completion.toolCalls).toEqual([{ id: 'c1', name: 'respond', input: {} }])
  })
})

describe('AnthropicProvider', () => {
  it('builds an empty assistant turn into a text block, never an empty content array', async () => {
    const provider = new AnthropicProvider({ apiKey: 'k' })
    const create = jest.spyOn((provider as any).client.messages, 'create') as jest.SpyInstance<any, any[]>
    create.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'ok' }],
    })

    await provider.complete({
      model: 'm',
      system: 's',
      maxTokens: 10,
      tools: [],
      messages: [
        { role: 'user', text: 'hi' },
        { role: 'assistant', toolCalls: [] },
      ],
    })

    const sent = create.mock.calls[0][0].messages as any[]
    expect(sent[1]).toEqual({ role: 'assistant', content: [{ type: 'text', text: '(no answer)' }] })
  })
})
