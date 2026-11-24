import { RetentionService } from './retention.service'

// Plain builders: the database is faked below, so the query shape does not matter here.
jest.mock('drizzle-orm', () => ({
  and: (...conditions: unknown[]) => ({ and: conditions }),
  eq: (column: unknown, value: unknown) => ({ eq: [column, value] }),
  isNotNull: (column: unknown) => ({ isNotNull: column }),
  lt: (column: unknown, value: unknown) => ({ lt: [column, value] }),
}))

const mockState = {
  due: [] as { id: string; storageKey: string }[],
  deleted: [] as string[],
}

jest.mock('@church/db', () => {
  const table = (name: string) => ({ __table: name, id: 'id', storageKey: 'storageKey', deletedAt: 'deletedAt', expiresAt: 'expiresAt' })
  return {
    documents: table('documents'),
    refreshTokens: table('refreshTokens'),
    aiConversations: table('aiConversations'),
    db: {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => mockState.due }),
        }),
      }),
      delete: (target: { __table: string }) => ({
        where: () => {
          // Awaitable like the real builder, with .returning() for the callers that need rows.
          const run = async () => {
            const rows = target.__table === 'refreshTokens' ? [{ id: 't1' }, { id: 't2' }] : [{ id: 'c1' }]
            mockState.deleted.push(target.__table)
            return rows
          }
          return { returning: run, then: (resolve: any, reject: any) => run().then(resolve, reject) }
        },
      }),
    },
  }
})

describe('RetentionService.runRetention', () => {
  beforeEach(() => {
    mockState.due = []
    mockState.deleted = []
  })

  it('removes the stored object, then the row, for each document past retention', async () => {
    mockState.due = [
      { id: 'd1', storageKey: 'library/d1.pdf' },
      { id: 'd2', storageKey: 'library/d2.pdf' },
    ]
    const files = { deleteFromS3: jest.fn().mockResolvedValue(undefined) }
    const service = new RetentionService(files as any)

    const result = await service.runRetention(new Date('2026-12-24T03:00:00Z'))

    expect(files.deleteFromS3.mock.calls).toEqual([['library/d1.pdf'], ['library/d2.pdf']])
    expect(result.documentsPurged).toBe(2)
    expect(mockState.deleted.filter((t) => t === 'documents')).toHaveLength(2)
  })

  it('keeps the row when the stored object cannot be removed, so the next run retries it', async () => {
    mockState.due = [{ id: 'd1', storageKey: 'library/d1.pdf' }]
    const files = { deleteFromS3: jest.fn().mockRejectedValue(new Error('S3 down')) }
    const service = new RetentionService(files as any)

    const result = await service.runRetention()

    expect(result.documentsPurged).toBe(0)
    expect(result.documentsFailed).toBe(1)
    expect(mockState.deleted).not.toContain('documents')
  })

  it('purges expired refresh tokens and AI conversations', async () => {
    const service = new RetentionService({ deleteFromS3: jest.fn() } as any)

    const result = await service.runRetention()

    expect(result.refreshTokensPurged).toBe(2)
    expect(result.aiConversationsPurged).toBe(1)
    expect(mockState.deleted).toEqual(expect.arrayContaining(['refreshTokens', 'aiConversations']))
  })
})
