// jest.config has no 'tsx' extension, so the React Email templates cannot be loaded here. Auth tests never send mail.
jest.mock('../mail/mail.service', () => ({ MailService: class MailService {} }))

jest.mock('drizzle-orm', () => ({
  and: (...predicates: Array<((row: any) => boolean) | undefined>) =>
    (row: any) => predicates.filter(Boolean).every((predicate) => predicate!(row)),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  isNull: (column: string) => (row: any) => row[column] == null,
}))

jest.mock('@church/db', () => {
  const users = { id: 'id', email: 'email', deletedAt: 'deletedAt' }
  const oauthProviderIdentities = {
    userId: 'userId',
    provider: 'provider',
    providerSubject: 'providerSubject',
  }
  const store = { users: [] as any[], identities: [] as any[] }
  const tableRows = (table: any) => (table === users ? store.users : store.identities)
  const db = {
    select: () => ({
      from: (table: any) => ({
        where: (predicate: (row: any) => boolean) => ({
          async limit() {
            return tableRows(table).filter(predicate).slice(0, 1).map((row) => ({ ...row }))
          },
        }),
      }),
    }),
    insert: (table: any) => ({
      values: (data: any) => ({
        async returning() {
          const row = { id: `${table === users ? 'user' : 'identity'}-${tableRows(table).length + 1}`, ...data }
          tableRows(table).push(row)
          return [{ ...row }]
        },
      }),
    }),
    update: (table: any) => ({
      set: (patch: any) => ({
        async where(predicate: (row: any) => boolean) {
          const rows = tableRows(table).filter(predicate)
          rows.forEach((row) => Object.assign(row, patch))
          return rows
        },
      }),
    }),
  }
  return {
    db,
    users,
    oauthProviderIdentities,
    refreshTokens: {},
    userChurchMemberships: {},
    churches: {},
    __reset() {
      store.users.length = 0
      store.identities.length = 0
    },
    __seedUser(user: any) {
      store.users.push({ passwordHash: null, deletedAt: null, isActive: true, ...user })
    },
    __seedIdentity(identity: any) {
      store.identities.push({ id: `identity-${store.identities.length + 1}`, ...identity })
    },
    __identities() {
      return store.identities.map((row) => ({ ...row }))
    },
  }
})

import { AuthService } from './auth.service'

const churchDb = require('@church/db') as {
  __reset: () => void
  __seedUser: (user: any) => void
  __seedIdentity: (identity: any) => void
  __identities: () => any[]
}

describe('AuthService OAuth provider-subject mapping', () => {
  let service: AuthService

  beforeEach(async () => {
    churchDb.__reset()
    service = new AuthService({ getDatabase: async () => (require('@church/db') as any).db } as any, {} as any, {} as any)
    await service.onModuleInit()
  })

  it('uses the linked subject owner even when the verified email belongs to another user', async () => {
    churchDb.__seedUser({ id: 'user-a', email: 'a@example.com', name: 'User A' })
    churchDb.__seedUser({ id: 'user-b', email: 'b@example.com', name: 'User B' })
    churchDb.__seedIdentity({ userId: 'user-a', provider: 'google', providerSubject: 'google-subject-a' })

    const result = await service.oauthLogin({
      subject: 'google-subject-a',
      email: 'b@example.com',
      name: 'Attacker supplied name',
    })

    expect(result.user?.id).toBe('user-a')
    expect(result.user?.email).toBe('a@example.com')
    expect(result.isNewUser).toBe(false)
  })

  it('persists the verified subject when linking a first passwordless OAuth login', async () => {
    churchDb.__seedUser({ id: 'user-a', email: 'a@example.com', name: 'User A' })

    await service.oauthLogin({
      subject: 'google-subject-a',
      email: 'a@example.com',
      name: 'User A',
    })

    expect(churchDb.__identities()).toEqual([
      expect.objectContaining({ userId: 'user-a', provider: 'google', providerSubject: 'google-subject-a' }),
    ])
  })
})
