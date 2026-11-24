import { NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { AiService } from './ai.service'
import { AiReadTools, type AiCaller } from './ai-tools'

// The Anthropic client is mocked: no network in tests.
const mockCreate = jest.fn()
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
}))

const CHURCH = '11111111-1111-4111-8111-111111111111'
const OWNER = '22222222-2222-4222-8222-222222222222'
const OTHER = '33333333-3333-4333-8333-333333333333'
const admin: AiCaller = { userId: OWNER, role: 'admin', churchId: CHURCH }

const toolUse = (name: string, input: unknown, id = 'tu_1') => ({ type: 'tool_use', id, name, input })
const reply = (content: unknown[]) => ({ id: 'msg_1', type: 'message', role: 'assistant', content, stop_reason: 'tool_use' })
const respond = (components: unknown[]) => reply([toolUse('respond', { components })])
const TEXT = (text: string) => ({ type: 'text', text })

class FakeStore {
  rows: any[] = []
  async purgeExpired(now: Date) {
    const before = this.rows.length
    this.rows = this.rows.filter((r) => !(r.expiresAt < now))
    return before - this.rows.length
  }
  async findOwned(id: string, userId: string, churchId: string) {
    return this.rows.find((r) => r.id === id && r.userId === userId && r.churchId === churchId)
  }
  async create(row: any) {
    this.rows.push({ ...row, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) })
  }
  async replaceMessages(id: string, messages: any[]) {
    this.rows.find((r) => r.id === id).messages = messages
  }
}

function setup() {
  const store = new FakeStore()
  const members = { listMembers: jest.fn().mockResolvedValue({ rows: [], total: 42 }) }
  const events = { getEventsByChurch: jest.fn().mockResolvedValue([]) }
  const files = { getMemberLibrary: jest.fn().mockResolvedValue([]) }
  const attendance = { listServiceTypes: jest.fn().mockResolvedValue([]) }
  const tools = new AiReadTools(members as any, events as any, files as any, attendance as any)
  const service = new AiService(store as any, tools)
  return { store, members, service }
}

describe('AiService.chat', () => {
  const savedKey = process.env.ANTHROPIC_API_KEY
  const savedModel = process.env.AI_MODEL

  beforeEach(() => {
    mockCreate.mockReset()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    delete process.env.AI_MODEL
  })

  afterAll(() => {
    if (savedKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = savedKey
    if (savedModel === undefined) delete process.env.AI_MODEL
    else process.env.AI_MODEL = savedModel
  })

  it('returns 503 and makes no call when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const { service } = setup()
    await expect(service.chat(admin, { message: 'hi' })).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns the validated respond components and stores the turn', async () => {
    mockCreate.mockResolvedValueOnce(respond([TEXT('Welcome')]))
    const { service, store } = setup()

    const result = await service.chat(admin, { message: 'hello' })

    expect(result.components).toEqual([TEXT('Welcome')])
    expect(result.conversationId).toMatch(/^[0-9a-f-]{36}$/)
    expect(store.rows).toHaveLength(1)
    expect(store.rows[0].messages.map((m: any) => m.role)).toEqual(['user', 'assistant'])
    const call = mockCreate.mock.calls[0][0]
    expect(call.model).toBe('claude-haiku-5-5')
    expect(call.tools.map((t: any) => t.name)).toContain('respond')
  })

  it('retries once with the validation errors, then returns the valid answer', async () => {
    mockCreate
      .mockResolvedValueOnce(respond([TEXT('x'.repeat(281))]))
      .mockResolvedValueOnce(respond([TEXT('Fixed')]))
    const { service } = setup()

    const result = await service.chat(admin, { message: 'hello' })

    expect(result.components).toEqual([TEXT('Fixed')])
    expect(mockCreate).toHaveBeenCalledTimes(2)
    const retryMessages = mockCreate.mock.calls[1][0].messages
    const toolResult = retryMessages[retryMessages.length - 1].content[0]
    expect(toolResult.is_error).toBe(true)
  })

  it('returns a single notice when the retry is also invalid', async () => {
    mockCreate.mockResolvedValue(respond([{ type: 'unknown_kind' }]))
    const { service } = setup()

    const result = await service.chat(admin, { message: 'hello' })

    expect(result.components).toHaveLength(1)
    expect(result.components[0]).toMatchObject({ type: 'notice', tone: 'warning' })
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('denies a tool the caller may not read and lets the model answer with a notice', async () => {
    const guest: AiCaller = { userId: OWNER, role: 'guest', churchId: CHURCH }
    mockCreate
      .mockResolvedValueOnce(reply([toolUse('member_count', {})]))
      .mockResolvedValueOnce(respond([{ type: 'notice', tone: 'info', text: 'Not available for your role.' }]))
    const { service, members } = setup()

    const result = await service.chat(guest, { message: 'how many members?' })

    expect(members.listMembers).not.toHaveBeenCalled()
    const second = mockCreate.mock.calls[1][0].messages
    const toolResult = second[second.length - 1].content[0]
    expect(toolResult.is_error).toBe(true)
    expect(toolResult.content).toContain('permission_denied')
    expect(result.components).toEqual([{ type: 'notice', tone: 'info', text: 'Not available for your role.' }])
  })

  it('runs an allowed read tool with the caller church', async () => {
    mockCreate
      .mockResolvedValueOnce(reply([toolUse('member_count', {})]))
      .mockResolvedValueOnce(respond([{ type: 'stat_cards', items: [{ label: 'Members', value: '42' }] }]))
    const { service, members } = setup()

    await service.chat(admin, { message: 'how many members?' })

    expect(members.listMembers).toHaveBeenCalledWith(CHURCH, expect.objectContaining({ limit: 1, offset: 0 }))
  })

  it('returns 404 for a conversation owned by another user', async () => {
    const { service, store } = setup()
    store.rows.push({ id: '44444444-4444-4444-8444-444444444444', userId: OTHER, churchId: CHURCH, messages: [] })

    await expect(
      service.chat(admin, { message: 'hi', conversationId: '44444444-4444-4444-8444-444444444444' }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('purges expired conversations on each call', async () => {
    mockCreate.mockResolvedValueOnce(respond([TEXT('ok')]))
    const { service, store } = setup()
    store.rows.push(
      { id: 'expired', userId: OTHER, churchId: CHURCH, messages: [], expiresAt: new Date(Date.now() - 1000) },
      { id: 'live', userId: OTHER, churchId: CHURCH, messages: [], expiresAt: new Date(Date.now() + 1000) },
    )

    await service.chat(admin, { message: 'hi' })

    expect(store.rows.map((r) => r.id)).toContain('live')
    expect(store.rows.map((r) => r.id)).not.toContain('expired')
  })

  it('sends at most the last 12 stored messages to the model', async () => {
    mockCreate.mockResolvedValueOnce(respond([TEXT('ok')]))
    const { service, store } = setup()
    const history = Array.from({ length: 14 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `m${i}`,
    }))
    store.rows.push({
      id: '55555555-5555-4555-8555-555555555555',
      userId: OWNER,
      churchId: CHURCH,
      messages: history,
      expiresAt: new Date(Date.now() + 1000),
    })

    await service.chat(admin, { message: 'next', conversationId: '55555555-5555-4555-8555-555555555555' })

    const sent = mockCreate.mock.calls[0][0].messages
    expect(sent).toHaveLength(13) // 12 history (starting on a user turn) + new question
    expect(sent[0].content).toBe('m2')
    expect(store.rows[0].messages).toHaveLength(12)
  })

  it('drops confirm_action components whose actionId is not registered', async () => {
    mockCreate.mockResolvedValueOnce(
      respond([
        TEXT('Here you go'),
        {
          type: 'confirm_action',
          title: 'Record',
          summary: 'Records attendance',
          action: { actionId: 'attendance.record', params: {} },
        },
      ]),
    )
    const { service } = setup()

    const result = await service.chat(admin, { message: 'record it' })

    expect(result.components).toEqual([TEXT('Here you go')])
  })

  it('exposes only the read-only tools (no prayer, family, giving or write tools)', () => {
    const { service } = setup()
    const names = (service as any).tools.definitions().map((d: any) => d.name)
    expect(names).toEqual(['member_count', 'upcoming_events', 'library_documents', 'service_types'])
    expect(names.join(' ')).not.toMatch(/prayer|famil|giv|offer|visitor|create|update|delete|write/i)
  })
})
