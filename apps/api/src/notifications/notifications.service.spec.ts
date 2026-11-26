import { NotFoundException } from '@nestjs/common'

jest.mock('drizzle-orm', () => ({
  and: (...predicates: Array<((row: any) => boolean) | undefined>) =>
    (row: any) => predicates.filter(Boolean).every((predicate) => predicate!(row)),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  inArray: (column: string, values: any[]) => (row: any) => values.includes(row[column]),
  isNull: (column: string) => (row: any) => row[column] == null,
}))

jest.mock('@church/db', () => {
  const notifications = {
    __table: 'notifications',
    id: 'id',
    userId: 'userId',
    churchId: 'churchId',
    readAt: 'readAt',
  }
  const memberships = {
    userId: 'userId',
    churchId: 'churchId',
    status: 'status',
    deletedAt: 'deletedAt',
  }
  const store = { notifications: [] as any[], memberships: [] as any[] }
  const db = {
    query: {
      inboxNotifications: {
        async findMany(options: { where?: (row: any) => boolean }) {
          return store.notifications.filter(options?.where ?? (() => true)).map((row) => ({ ...row }))
        },
      },
      userChurchMemberships: {
        async findMany(options: { where?: (row: any) => boolean }) {
          return store.memberships.filter(options?.where ?? (() => true)).map((row) => ({ ...row }))
        },
      },
    },
  }
  return {
    db,
    inboxNotifications: notifications,
    userChurchMemberships: memberships,
    __reset() {
      store.notifications.length = 0
      store.memberships.length = 0
    },
    __seedNotification(row: Record<string, any>) {
      store.notifications.push({
        id: `notification-${store.notifications.length + 1}`,
        userId: 'user-a',
        churchId: null,
        type: 'announcement',
        templateKey: 'announcement.test',
        templateData: {},
        targetType: null,
        targetParams: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        readAt: null,
        ...row,
      })
    },
    __seedMembership(row: Record<string, any>) {
      store.memberships.push({ userId: 'user-a', churchId: 'church-a', status: 'active', deletedAt: null, ...row })
    },
  }
})

import { NotificationsService } from './notifications.service'

const churchDb = require('@church/db') as {
  __reset: () => void
  __seedNotification: (row: Record<string, any>) => void
  __seedMembership: (row: Record<string, any>) => void
}

describe('NotificationsService private inbox', () => {
  let service: NotificationsService

  beforeEach(() => {
    churchDb.__reset()
    service = new NotificationsService()
    churchDb.__seedMembership({ userId: 'user-a', churchId: 'church-a' })
  })

  it('filters notifications from revoked or unrelated church contexts', async () => {
    churchDb.__seedNotification({ id: 'global', churchId: null })
    churchDb.__seedNotification({ id: 'same-church', churchId: 'church-a' })
    churchDb.__seedNotification({ id: 'other-church', churchId: 'church-b' })

    const result = await service.list('user-a')

    expect(result.items.map((item) => item.id)).toEqual(['global', 'same-church'])
    await expect(service.list('user-b')).resolves.toMatchObject({ items: [], unreadCount: 0 })
  })

  it('does not permit reading an inaccessible notification by id', async () => {
    churchDb.__seedNotification({ id: 'other-church', churchId: 'church-b' })

    await expect(service.markRead('user-a', 'other-church')).rejects.toThrow(NotFoundException)
  })
})
