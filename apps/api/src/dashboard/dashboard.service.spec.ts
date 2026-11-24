/**
 * Church scoping for DashboardService.getStats: rows belonging to another
 * church (and soft-deleted rows) must not be counted. Uses an in-memory store
 * behind a faked @church/db, same approach as visitors.service.spec.ts.
 */
jest.mock('drizzle-orm', () => ({
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  and: (...preds: any[]) => (row: any) => preds.every((p) => p(row)),
  isNull: (column: string) => (row: any) => row[column] == null,
  count: () => ({}),
}))

jest.mock('@church/db', () => {
  const store: Record<string, any[]> = { members: [], zones: [] }
  const table = (name: string, keys: string[]) => {
    const ref: Record<string, any> = { __table: name }
    for (const k of keys) ref[k] = k
    return ref
  }
  const members = table('members', ['id', 'churchId', 'deletedAt'])
  const zones = table('zones', ['id', 'churchId', 'deletedAt'])

  return {
    __store: store,
    members,
    zones,
    db: {
      select: () => ({
        from: (t: any) => ({
          where: async (pred: (row: any) => boolean) => [
            { value: store[t.__table].filter(pred).length },
          ],
        }),
      }),
    },
  }
})

import { DashboardService } from './dashboard.service'

const store = (jest.requireMock('@church/db') as any).__store as Record<string, any[]>

describe('DashboardService.getStats church scoping', () => {
  beforeEach(() => {
    store.members = [
      { churchId: 'church-a', deletedAt: null },
      { churchId: 'church-a', deletedAt: null },
      { churchId: 'church-a', deletedAt: '2026-01-01' },
      { churchId: 'church-b', deletedAt: null },
    ]
    store.zones = [
      { churchId: 'church-a', deletedAt: null },
      { churchId: 'church-b', deletedAt: null },
      { churchId: 'church-b', deletedAt: null },
      { churchId: 'church-a', deletedAt: '2026-01-01' },
    ]
  })

  it('counts only non-deleted rows of the requested church', async () => {
    const service = new DashboardService()
    await expect(service.getStats('church-a')).resolves.toEqual({
      totalMembers: 2,
      activeZones: 1,
    })
    await expect(service.getStats('church-b')).resolves.toEqual({
      totalMembers: 1,
      activeZones: 2,
    })
  })
})
