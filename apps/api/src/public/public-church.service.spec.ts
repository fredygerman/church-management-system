jest.mock('drizzle-orm', () => ({
  and: (...predicates: Array<((row: any) => boolean) | undefined>) =>
    (row: any) => predicates.filter(Boolean).every((predicate) => predicate!(row)),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  ilike: (column: string, pattern: string) => (row: any) =>
    String(row[column] ?? '').toLowerCase().includes(pattern.slice(1, -1).toLowerCase()),
  isNotNull: (column: string) => (row: any) => row[column] != null,
  isNull: (column: string) => (row: any) => row[column] == null,
  or: (...predicates: Array<(row: any) => boolean>) => (row: any) => predicates.some((predicate) => predicate(row)),
}))

jest.mock('@church/db', () => {
  const profiles = {
    publicId: 'publicId',
    deletedAt: 'deletedAt',
    publishedAt: 'publishedAt',
    name: 'name',
    location: 'location',
  }
  const events = {
    churchId: 'churchId',
    status: 'status',
    publicPublishedAt: 'publicPublishedAt',
    deletedAt: 'deletedAt',
  }
  const store = { profiles: [] as any[], events: [] as any[] }
  const db = {
    query: {
      publicChurchProfiles: {
        async findMany(options: { where?: (row: any) => boolean }) {
          return store.profiles.filter(options?.where ?? (() => true)).map((row) => ({ ...row }))
        },
      },
      events: {
        async findMany(options: { where?: (row: any) => boolean }) {
          return store.events.filter(options?.where ?? (() => true)).map((row) => ({ ...row }))
        },
      },
    },
  }
  return {
    db,
    publicChurchProfiles: profiles,
    events,
    __reset() {
      store.profiles.length = 0
      store.events.length = 0
    },
    __seedProfile(row: Record<string, any>) {
      store.profiles.push({
        churchId: 'church-a',
        publicId: 'mito-ya-baraka',
        name: 'Mito Ya Baraka Church',
        location: 'HQ',
        contactPhone: null,
        contactEmail: null,
        about: null,
        imageUrl: null,
        publishedAt: new Date(),
        deletedAt: null,
        ...row,
      })
    },
    __seedEvent(row: Record<string, any>) {
      store.events.push({
        id: 'event-1',
        churchId: 'church-a',
        title: 'Sunday service',
        description: null,
        location: 'HQ',
        startsAt: new Date(),
        endsAt: null,
        status: 'published',
        publicPublishedAt: new Date(),
        deletedAt: null,
        ...row,
      })
    },
  }
})

import { PublicChurchService } from './public-church.service'

const churchDb = require('@church/db') as {
  __reset: () => void
  __seedProfile: (row: Record<string, any>) => void
  __seedEvent: (row: Record<string, any>) => void
}

describe('PublicChurchService', () => {
  let service: PublicChurchService

  beforeEach(() => {
    churchDb.__reset()
    service = new PublicChurchService()
  })

  it('lists only explicitly published profiles', async () => {
    churchDb.__seedProfile({ publicId: 'published' })
    churchDb.__seedProfile({ publicId: 'draft', publishedAt: null })
    churchDb.__seedProfile({ publicId: 'deleted', deletedAt: new Date() })

    const result = await service.listChurches()

    expect(result.items.map((item) => item.publicId)).toEqual(['published'])
  })

  it('projects only approved fields and explicitly public events', async () => {
    churchDb.__seedProfile({ publicId: 'published', leadPastorName: 'Private pastor field' })
    churchDb.__seedEvent({ id: 'public-event' })
    churchDb.__seedEvent({ id: 'private-event', publicPublishedAt: null })

    const result = await service.getChurch('published')

    expect(result).toMatchObject({ publicId: 'published', name: 'Mito Ya Baraka Church' })
    expect(result).not.toHaveProperty('leadPastorName')
    expect(result.events.map((event) => event.id)).toEqual(['public-event'])
  })
})
