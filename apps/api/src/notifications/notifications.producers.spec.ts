jest.mock('drizzle-orm', () => ({
  and: (...predicates: Array<((row: any) => boolean) | undefined>) =>
    (row: any) => predicates.filter(Boolean).every((predicate) => predicate!(row)),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  isNull: (column: string) => (row: any) => row[column] == null,
}))

jest.mock('@church/db', () => {
  const inboxNotifications = { sourceKey: 'sourceKey' }
  const userChurchMemberships = { churchId: 'churchId', status: 'status', deletedAt: 'deletedAt' }
  const store = {
    memberships: [
      { userId: 'user-a', churchId: 'church-a', status: 'active', deletedAt: null },
      { userId: 'user-b', churchId: 'church-a', status: 'active', deletedAt: null },
    ],
    notifications: [] as any[],
  }
  const db = {
    query: {
      userChurchMemberships: {
        async findMany(options: { where: (row: any) => boolean }) {
          return store.memberships.filter(options.where).map((row) => ({ ...row }))
        },
      },
    },
    insert: (table: any) => ({
      values: (rows: any[]) => ({
        onConflictDoNothing: () => ({
          async returning() {
            const created = rows.filter((row) => !store.notifications.some((existing) => existing.sourceKey === row.sourceKey))
            created.forEach((row, index) => store.notifications.push({
              id: `notification-${store.notifications.length + index + 1}`,
              createdAt: new Date(),
              readAt: null,
              ...row,
            }))
            return created.map((row, index) => ({
              id: `notification-${store.notifications.length - created.length + index + 1}`,
              createdAt: new Date(),
              readAt: null,
              ...row,
            }))
          },
        }),
      }),
    }),
  }
  return { db, inboxNotifications, userChurchMemberships, __notifications: () => store.notifications }
})

import { NotificationsService } from './notifications.service'

const churchDb = require('@church/db') as { __notifications: () => any[] }

describe('NotificationsService producer fan-out', () => {
  it('deduplicates retries per recipient while keeping church scope', async () => {
    const service = new NotificationsService()
    const input = {
      churchId: 'church-a',
      type: 'event_created',
      templateKey: 'events.created',
      templateData: { title: 'Prayer night' },
      targetType: 'event',
      targetParams: { eventId: 'event-1' },
      sourceKey: 'event-created:event-1',
    }

    await service.notifyChurchMembers(input)
    await service.notifyChurchMembers(input)

    expect(churchDb.__notifications()).toHaveLength(2)
    expect(churchDb.__notifications()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'user-a', churchId: 'church-a', sourceKey: 'event-created:event-1:user-a' }),
        expect.objectContaining({ userId: 'user-b', churchId: 'church-a', sourceKey: 'event-created:event-1:user-b' }),
      ]),
    )
  })
})
