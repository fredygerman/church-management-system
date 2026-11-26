jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto')
  return { ...actual, randomBytes: jest.fn(() => Buffer.from('test-recovery-token')) }
})

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('new-password-hash'),
}))

jest.mock('drizzle-orm', () => ({
  and: (...predicates: Array<((row: any) => boolean) | undefined>) =>
    (row: any) => predicates.filter(Boolean).every((predicate) => predicate!(row)),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  gt: (column: string, value: any) => (row: any) => row[column] > value,
  isNull: (column: string) => (row: any) => row[column] == null,
  lt: (column: string, value: any) => (row: any) => row[column] < value,
  sql: () => 'sql-expression',
}))

jest.mock('@church/db', () => {
  const users = { id: 'id', email: 'email', deletedAt: 'deletedAt', tokenVersion: 'tokenVersion' }
  const passwordRecoveryTokens = {
    id: 'id', userId: 'userId', tokenHash: 'tokenHash', expiresAt: 'expiresAt', consumedAt: 'consumedAt',
  }
  const refreshTokens = { userId: 'userId', usedAt: 'usedAt', expiresAt: 'expiresAt' }
  const store = { users: [] as any[], recovery: [] as any[], refresh: [] as any[] }
  const tableRows = (table: any) => table === users ? store.users : table === passwordRecoveryTokens ? store.recovery : store.refresh
  const copy = (row: any) => ({ ...row })
  const db = {
    select: () => ({
      from: (table: any) => ({
        where: (predicate: (row: any) => boolean) => ({
          async limit() { return tableRows(table).filter(predicate).slice(0, 1).map(copy) },
        }),
      }),
    }),
    insert: (table: any) => ({
      values: (data: any) => ({
        async returning(selection?: Record<string, string>) {
          const row = {
            id: `${table === users ? 'user' : table === passwordRecoveryTokens ? 'recovery' : 'refresh'}-${tableRows(table).length + 1}`,
            consumedAt: table === passwordRecoveryTokens ? null : undefined,
            usedAt: table === refreshTokens ? null : undefined,
            ...data,
          }
          tableRows(table).push(row)
          return [selection ? Object.fromEntries(Object.keys(selection).map((key) => [key, row[selection[key]]])) : copy(row)]
        },
      }),
    }),
    delete: (table: any) => ({
      async where(predicate: (row: any) => boolean) {
        const rows = tableRows(table)
        rows.splice(0, rows.length, ...rows.filter((row) => !predicate(row)))
      },
    }),
    update: (table: any) => ({
      set: (patch: any) => ({
        where: (predicate: (row: any) => boolean) => {
          const matched = tableRows(table).filter(predicate)
          matched.forEach((row) => Object.assign(row, patch))
          const result: any = Promise.resolve(matched.map(copy))
          result.returning = async (selection?: Record<string, string>) =>
            matched.map((row) => selection ? Object.fromEntries(Object.keys(selection).map((key) => [key, row[selection[key]]])) : copy(row))
          return result
        },
      }),
    }),
    transaction: async (callback: (tx: any) => Promise<any>) => callback(db),
  }
  return {
    db,
    users,
    passwordRecoveryTokens,
    refreshTokens,
    oauthProviderIdentities: {},
    userChurchMemberships: {},
    churches: {},
    __reset() { store.users.length = 0; store.recovery.length = 0; store.refresh.length = 0 },
    __seedUser(user: any) { store.users.push({ isActive: true, deletedAt: null, tokenVersion: 0, ...user }) },
    __seedRefresh(row: any) { store.refresh.push({ usedAt: null, ...row }) },
    __recovery() { return store.recovery },
    __user() { return store.users[0] },
    __refresh() { return store.refresh[0] },
  }
})

import { UnauthorizedException } from '@nestjs/common'
import { createHash } from 'crypto'
import { AuthService } from './auth.service'

const churchDb = require('@church/db') as any

describe('AuthService password recovery', () => {
  const previousDelivery = process.env.PASSWORD_RECOVERY_DELIVERY_CONFIGURED
  let service: AuthService

  beforeEach(async () => {
    process.env.PASSWORD_RECOVERY_DELIVERY_CONFIGURED = 'true'
    churchDb.__reset()
    churchDb.__seedUser({ id: 'user-a', email: 'a@example.com', passwordHash: 'old-hash' })
    churchDb.__seedRefresh({ id: 'refresh-a', userId: 'user-a' })
    service = new AuthService({ getDatabase: async () => churchDb.db } as any, {} as any)
    await service.onModuleInit()
  })

  afterAll(() => {
    if (previousDelivery === undefined) delete process.env.PASSWORD_RECOVERY_DELIVERY_CONFIGURED
    else process.env.PASSWORD_RECOVERY_DELIVERY_CONFIGURED = previousDelivery
  })

  it('consumes a recovery token once and revokes sessions', async () => {
    await service.requestPasswordRecovery('a@example.com', 'ip-a')
    const rawToken = Buffer.from('test-recovery-token').toString('base64url')
    expect(churchDb.__recovery()[0].tokenHash).toBe(createHash('sha256').update(rawToken).digest('hex'))
    expect(churchDb.__recovery()[0]).not.toHaveProperty('token')

    await expect(service.confirmPasswordRecovery(rawToken, 'new-password-123')).resolves.toEqual({
      message: 'Password reset successful',
    })
    await expect(service.confirmPasswordRecovery(rawToken, 'new-password-123')).rejects.toThrow(UnauthorizedException)
    expect(churchDb.__recovery()[0].consumedAt).toBeInstanceOf(Date)
    expect(churchDb.__refresh().usedAt).toBeInstanceOf(Date)
    expect(churchDb.__user().passwordHash).not.toBe('old-hash')
  })

  it('rejects an expired token without changing the password', async () => {
    await service.requestPasswordRecovery('a@example.com', 'ip-a')
    churchDb.__recovery()[0].expiresAt = new Date(Date.now() - 1)

    await expect(service.confirmPasswordRecovery(Buffer.from('test-recovery-token').toString('base64url'), 'new-password-123')).rejects.toThrow(
      UnauthorizedException,
    )
    expect(churchDb.__user().passwordHash).toBe('old-hash')
    expect(churchDb.__recovery()[0].consumedAt).toBeNull()
  })

  it('rate-limits recovery requests by caller key', async () => {
    process.env.PASSWORD_RECOVERY_DELIVERY_CONFIGURED = 'false'
    for (let index = 0; index < 5; index += 1) {
      await service.requestPasswordRecovery('unknown@example.com', `ip-${index}`)
    }
    await expect(service.requestPasswordRecovery('unknown@example.com', 'ip-5')).rejects.toThrow()
  })
})
