/**
 * Fakes @church/db with a tiny in-memory store so DepartmentsService's real query
 * logic (church-scoping, soft-delete filtering, upserts) can be exercised without a
 * real database. drizzle-orm's eq/and/isNull/inArray are mocked as plain predicate
 * closures operating on our in-memory rows (column refs are just field-name strings).
 */
jest.mock('drizzle-orm', () => ({
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  and: (...preds: any[]) => (row: any) => preds.filter(Boolean).every((p) => p(row)),
  isNull: (column: string) => (row: any) => row[column] == null,
  inArray: (column: string, values: any[]) => (row: any) => values.includes(row[column]),
}))

jest.mock('@church/db', () => {
  const store: Record<string, any[]> = {
    departments: [],
    memberDepartments: [],
    members: [],
  }

  const makeColumnRef = (tableName: string, keys: string[]) => {
    const ref: Record<string, string> = { __table: tableName }
    for (const key of keys) ref[key] = key
    return ref
  }

  const departments = makeColumnRef('departments', [
    'id', 'churchId', 'name', 'description', 'meetingDay', 'createdAt', 'updatedAt', 'deletedAt',
  ])
  const memberDepartments = makeColumnRef('memberDepartments', [
    'id', 'memberId', 'departmentId', 'churchId', 'isLeader', 'createdAt', 'updatedAt', 'deletedAt',
  ])
  const members = makeColumnRef('members', [
    'id', 'firstName', 'lastName', 'phone', 'churchId', 'createdAt', 'updatedAt', 'deletedAt',
  ])

  const tableArr = (table: any) => store[table.__table]
  const today = () => new Date().toISOString().split('T')[0]
  const makeId = () => Math.random().toString(36).slice(2)

  const findMany = (table: any) => async (opts: any) => {
    let rows = opts?.where ? tableArr(table).filter(opts.where) : tableArr(table).slice()
    if (opts?.limit) rows = rows.slice(0, opts.limit)
    return rows.map((r: any) => ({ ...r }))
  }

  const db = {
    insert(table: any) {
      return {
        values(data: any) {
          const row = { id: makeId(), createdAt: today(), updatedAt: today(), deletedAt: null, ...data }
          return {
            async returning() {
              tableArr(table).push(row)
              return [row]
            },
            onConflictDoUpdate({ target, set }: any) {
              return {
                async returning() {
                  const arr = tableArr(table)
                  const existing = arr.find((r: any) => target.every((col: string) => r[col] === data[col]))
                  if (existing) {
                    Object.assign(existing, set)
                    return [existing]
                  }
                  arr.push(row)
                  return [row]
                },
              }
            },
          }
        },
      }
    },
    update(table: any) {
      return {
        set(patch: any) {
          return {
            where(pred: any) {
              // Applying the update eagerly and returning a thenable (not just an
              // object with a `.returning()` method) so `await ...where(...)` alone
              // — without a trailing `.returning()` — still executes the mutation,
              // matching real drizzle query builder semantics.
              const matched = tableArr(table).filter(pred)
              matched.forEach((r: any) => Object.assign(r, patch))
              const result: any = Promise.resolve(matched)
              result.returning = async () => matched
              return result
            },
          }
        },
      }
    },
    delete(table: any) {
      return {
        async where(pred: any) {
          const arr = tableArr(table)
          const remaining = arr.filter((r: any) => !pred(r))
          arr.length = 0
          arr.push(...remaining)
        },
      }
    },
    select(_selection: any) {
      return {
        from(fromTable: any) {
          return {
            innerJoin(joinTable1: any) {
              return {
                innerJoin(joinTable2: any) {
                  return {
                    async where(pred: any) {
                      const merged: any[] = []
                      for (const mdRow of tableArr(fromTable)) {
                        const dept = tableArr(joinTable1).find((d: any) => d.id === mdRow.departmentId)
                        const mem = tableArr(joinTable2).find((m: any) => m.id === mdRow.memberId)
                        if (!dept || !mem) continue
                        merged.push({
                          ...dept,
                          ...mem,
                          isLeader: mdRow.isLeader,
                          departmentId: mdRow.departmentId,
                          memberId: mdRow.memberId,
                        })
                      }
                      return merged.filter(pred)
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
    query: {
      departments: { findMany: findMany(departments) },
      memberDepartments: { findMany: findMany(memberDepartments) },
      members: { findMany: findMany(members) },
    },
  }

  return {
    db,
    departments,
    memberDepartments,
    members,
    __reset() {
      store.departments = []
      store.memberDepartments = []
      store.members = []
    },
    __seedMember(row: any) {
      const member = { id: makeId(), createdAt: today(), updatedAt: today(), deletedAt: null, ...row }
      store.members.push(member)
      return member
    },
  }
})

import { DepartmentsService } from './departments.service'

const churchDb = require('@church/db') as {
  __reset: () => void
  __seedMember: (row: any) => any
}

const CHURCH_A = 'church-a'
const CHURCH_B = 'church-b'

describe('DepartmentsService', () => {
  let service: DepartmentsService

  beforeEach(() => {
    churchDb.__reset()
    service = new DepartmentsService()
  })

  it('creates a department', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    expect(department).toMatchObject({ churchId: CHURCH_A, name: 'Choir' })
    expect(department.id).toBeDefined()
  })

  it('lists only non-deleted departments in the church', async () => {
    const choir = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    await service.createDepartment({ churchId: CHURCH_A, name: 'Ushers' })
    await service.deleteDepartment(CHURCH_A, choir.id)

    const list = await service.getDepartmentsByChurch(CHURCH_A)
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Ushers')
  })

  it('updates a department', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    const updated = await service.updateDepartment(CHURCH_A, department.id, { meetingDay: 'Sunday' })
    expect(updated.meetingDay).toBe('Sunday')
  })

  it('soft-deletes a department (row stays, excluded from reads)', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    await service.deleteDepartment(CHURCH_A, department.id)

    const found = await service.getDepartmentByIdInChurch(CHURCH_A, department.id)
    expect(found).toBeUndefined()
  })

  it('assigns a member to a department and upserts on re-assignment', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    const member = churchDb.__seedMember({ churchId: CHURCH_A, firstName: 'A' })

    const first = await service.assignMemberToDepartment(CHURCH_A, department.id, member.id, false)
    expect(first.isLeader).toBe(false)

    const second = await service.assignMemberToDepartment(CHURCH_A, department.id, member.id, true)
    expect(second.isLeader).toBe(true)

    const members = await service.getDepartmentMembers(CHURCH_A, department.id)
    expect(members).toHaveLength(1)
  })

  it('removes a member from a department (hard delete)', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    const member = churchDb.__seedMember({ churchId: CHURCH_A, firstName: 'A' })
    await service.assignMemberToDepartment(CHURCH_A, department.id, member.id)

    await service.removeMemberFromDepartment(CHURCH_A, department.id, member.id)

    const members = await service.getDepartmentMembers(CHURCH_A, department.id)
    expect(members).toHaveLength(0)
  })

  it('rejects making an unassigned member a leader', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    const member = churchDb.__seedMember({ churchId: CHURCH_A, firstName: 'A' })

    await expect(service.addLeader(CHURCH_A, department.id, member.id)).rejects.toThrow()
  })

  it('allows multiple leaders to coexist on one department', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    const memberOne = churchDb.__seedMember({ churchId: CHURCH_A, firstName: 'A' })
    const memberTwo = churchDb.__seedMember({ churchId: CHURCH_A, firstName: 'B' })

    await service.assignMemberToDepartment(CHURCH_A, department.id, memberOne.id)
    await service.assignMemberToDepartment(CHURCH_A, department.id, memberTwo.id)

    await service.addLeader(CHURCH_A, department.id, memberOne.id)
    await service.addLeader(CHURCH_A, department.id, memberTwo.id)

    const members = await service.getDepartmentMembers(CHURCH_A, department.id)
    expect(members.filter((m) => m.isLeader)).toHaveLength(2)

    const stats = await service.getDepartmentStats(CHURCH_A, department.id)
    expect(stats).toEqual({ totalMembers: 2, leaders: 2, regularMembers: 0 })
  })

  it('removes a leader without deleting the membership row', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    const member = churchDb.__seedMember({ churchId: CHURCH_A, firstName: 'A' })
    await service.assignMemberToDepartment(CHURCH_A, department.id, member.id)
    await service.addLeader(CHURCH_A, department.id, member.id)

    await service.removeLeader(CHURCH_A, department.id, member.id)

    const members = await service.getDepartmentMembers(CHURCH_A, department.id)
    expect(members).toHaveLength(1)
    expect(members[0].isLeader).toBe(false)
  })

  it('scopes departments to their church (church A invisible to church B)', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })

    const churchBList = await service.getDepartmentsByChurch(CHURCH_B)
    expect(churchBList).toHaveLength(0)

    const churchBDetail = await service.getDepartmentByIdInChurch(CHURCH_B, department.id)
    expect(churchBDetail).toBeUndefined()

    const churchADetail = await service.getDepartmentByIdInChurch(CHURCH_A, department.id)
    expect(churchADetail).toBeDefined()
  })

  it('returns an empty list when ledDepartmentIds is an empty array, without querying all departments', async () => {
    await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })

    const result = await service.getDepartmentsByChurch(CHURCH_A, [])
    expect(result).toEqual([])
  })

  it('filters to the led department when ledDepartmentIds is provided', async () => {
    const choir = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    await service.createDepartment({ churchId: CHURCH_A, name: 'Ushers' })

    const result = await service.getDepartmentsByChurch(CHURCH_A, [choir.id])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(choir.id)
  })

  it('resolves led department ids from member_departments', async () => {
    const department = await service.createDepartment({ churchId: CHURCH_A, name: 'Choir' })
    const member = churchDb.__seedMember({ churchId: CHURCH_A, firstName: 'A' })
    await service.assignMemberToDepartment(CHURCH_A, department.id, member.id)
    await service.addLeader(CHURCH_A, department.id, member.id)

    const ledIds = await service.getLedDepartmentIds(CHURCH_A, member.id)
    expect(ledIds).toEqual([department.id])
  })
})
