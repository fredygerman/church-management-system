import { BadRequestException } from '@nestjs/common'

// Drizzle operators become inspectable plain objects so tests can assert the
// exact predicate tree (church scope, soft-delete filter, filters, sort).
jest.mock('drizzle-orm', () => ({
  eq: (col: string, val: unknown) => ({ op: 'eq', col, val }),
  and: (...parts: unknown[]) => ({ op: 'and', parts: parts.filter(Boolean) }),
  isNull: (col: string) => ({ op: 'isNull', col }),
  or: (...parts: unknown[]) => ({ op: 'or', parts }),
  ilike: (col: string, val: string) => ({ op: 'ilike', col, val }),
  asc: (col: string) => ({ op: 'asc', col }),
  desc: (col: string) => ({ op: 'desc', col }),
  count: () => ({ op: 'count' }),
}))

const mockSelect = jest.fn()

jest.mock('@church/db', () => ({
  db: { select: (...args: unknown[]) => mockSelect(...args) },
  members: {
    id: 'members.id',
    churchId: 'members.churchId',
    firstName: 'members.firstName',
    lastName: 'members.lastName',
    occupation: 'members.occupation',
    gender: 'members.gender',
    maritalStatus: 'members.maritalStatus',
    phone: 'members.phone',
    createdAt: 'members.createdAt',
    updatedAt: 'members.updatedAt',
    deletedAt: 'members.deletedAt',
  },
  memberZones: {},
  zones: {},
  userChurchMemberships: {},
}))

import { MembersService } from './members.service'
import {
  buildMemberListMeta,
  computeTotalPages,
  parseMemberListQuery,
} from './members-list'

// Fake query builders: the rows query ends in .offset(), the count query ends in .where().
const mockListQueries = (rows: unknown[], total: number) => {
  const captured: { where?: unknown; orderBy?: unknown[]; limit?: number; offset?: number; countWhere?: unknown } = {}
  mockSelect
    .mockImplementationOnce(() => ({
      from: () => ({
        where: (w: unknown) => {
          captured.where = w
          return {
            orderBy: (...o: unknown[]) => {
              captured.orderBy = o
              return {
                limit: (l: number) => {
                  captured.limit = l
                  return {
                    offset: (o2: number) => {
                      captured.offset = o2
                      return Promise.resolve(rows)
                    },
                  }
                },
              }
            },
          }
        },
      }),
    }))
    .mockImplementationOnce(() => ({
      from: () => ({
        where: (w: unknown) => {
          captured.countWhere = w
          return Promise.resolve([{ value: total }])
        },
      }),
    }))
  return captured
}

describe('MembersService.listMembers', () => {
  const service = new MembersService()

  beforeEach(() => mockSelect.mockReset())

  it('scopes rows and count to the church and excludes soft-deleted members', async () => {
    const captured = mockListQueries([], 0)
    await service.listMembers('church-1', parseMemberListQuery({}))

    const expectedWhere = {
      op: 'and',
      parts: [
        { op: 'eq', col: 'members.churchId', val: 'church-1' },
        { op: 'isNull', col: 'members.deletedAt' },
      ],
    }
    expect(captured.where).toEqual(expectedWhere)
    expect(captured.countWhere).toEqual(expectedWhere)
  })

  it('applies the same filters to the page query and the count query', async () => {
    const captured = mockListQueries([], 0)
    await service.listMembers(
      'church-1',
      parseMemberListQuery({ firstName: 'Jo', gender: 'female', maritalStatus: 'married' }),
    )

    expect(captured.where).toEqual(captured.countWhere)
    expect(captured.where).toEqual({
      op: 'and',
      parts: expect.arrayContaining([
        { op: 'eq', col: 'members.churchId', val: 'church-1' },
        { op: 'ilike', col: 'members.firstName', val: '%Jo%' },
        { op: 'eq', col: 'members.gender', val: 'female' },
        { op: 'eq', col: 'members.maritalStatus', val: 'married' },
      ]),
    })
  })

  it('escapes LIKE wildcards in text filters', async () => {
    const captured = mockListQueries([], 0)
    await service.listMembers('church-1', parseMemberListQuery({ lastName: '50%_off\\' }))
    expect(captured.where).toEqual(expect.objectContaining({
      parts: expect.arrayContaining([
        { op: 'ilike', col: 'members.lastName', val: '%50\\%\\_off\\\\%' },
      ]),
    }))
  })

  it('sorts by the whitelisted column with an id tiebreaker and returns the total', async () => {
    const captured = mockListQueries([{ id: 'm1', firstName: 'Ann' }], 7)
    const result = await service.listMembers(
      'church-1',
      parseMemberListQuery({ sort: 'updated_at.asc', limit: '10', offset: '20' }),
    )

    expect(captured.orderBy).toEqual([{ op: 'asc', col: 'members.updatedAt' }, { op: 'asc', col: 'members.id' }])
    expect(captured.limit).toBe(10)
    expect(captured.offset).toBe(20)
    expect(result).toEqual({ rows: [{ id: 'm1', firstName: 'Ann' }], total: 7 })
  })
})

describe('parseMemberListQuery', () => {
  it('rejects an unknown sort column', () => {
    expect(() => parseMemberListQuery({ sort: 'firstName.asc' })).toThrow(BadRequestException)
    expect(() => parseMemberListQuery({ sort: 'created_at.desc; DROP TABLE members' })).toThrow(BadRequestException)
  })

  it('defaults sort to created_at.desc', () => {
    expect(parseMemberListQuery({}).sort).toBe('created_at.desc')
  })

  it('clamps limit to 100 and defaults to 100', () => {
    expect(parseMemberListQuery({ limit: '500' }).limit).toBe(100)
    expect(parseMemberListQuery({}).limit).toBe(100)
    expect(parseMemberListQuery({ limit: '25' }).limit).toBe(25)
  })

  it('rejects from/to instead of silently ignoring them', () => {
    expect(() => parseMemberListQuery({ from: '2024-01-01' })).toThrow(BadRequestException)
    expect(() => parseMemberListQuery({ to: '2024-12-31' })).toThrow(BadRequestException)
  })

  it('rejects gender and maritalStatus values outside the enum', () => {
    expect(() => parseMemberListQuery({ gender: 'robot' })).toThrow(BadRequestException)
    expect(() => parseMemberListQuery({ maritalStatus: 'complicated' })).toThrow(BadRequestException)
  })

  it('drops blank text filters', () => {
    const q = parseMemberListQuery({ firstName: '   ', occupation: 'Teacher' })
    expect(q.firstName).toBeUndefined()
    expect(q.occupation).toBe('Teacher')
  })
})

describe('total_pages math', () => {
  it.each([
    [0, 10, 0],
    [1, 10, 1],
    [10, 10, 1],
    [11, 10, 2],
    [101, 100, 2],
  ])('total %i with limit %i gives %i pages', (total, limit, pages) => {
    expect(computeTotalPages(total, limit)).toBe(pages)
  })

  it('builds meta with the page derived from offset', () => {
    expect(buildMemberListMeta(45, { limit: 10, offset: 20 })).toEqual({
      total: 45,
      page: 3,
      limit: 10,
      total_pages: 5,
    })
  })
})
