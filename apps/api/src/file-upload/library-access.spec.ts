import { NotFoundException } from '@nestjs/common'
import 'reflect-metadata'

jest.mock('drizzle-orm', () => ({
  and: (...predicates: Array<((row: any) => boolean) | undefined>) =>
    (row: any) => predicates.filter(Boolean).every((predicate) => predicate!(row)),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  ilike: (column: string, pattern: string) => (row: any) =>
    String(row[column] ?? '').toLowerCase().includes(pattern.slice(1, -1).toLowerCase()),
  isNull: (column: string) => (row: any) => row[column] == null,
}))

jest.mock('@church/db', () => {
  const documents = {
    __table: 'documents',
    id: 'id',
    churchId: 'churchId',
    deletedAt: 'deletedAt',
    resourceType: 'resourceType',
    title: 'title',
  }
  const memberships = {
    userId: 'userId',
    churchId: 'churchId',
    status: 'status',
    deletedAt: 'deletedAt',
  }
  const store = { documents: [] as any[], memberships: [] as any[] }
  const db = {
    query: {
      documents: {
        async findMany(options: { where?: (row: any) => boolean }) {
          return store.documents.filter(options?.where ?? (() => true)).map((row) => ({ ...row }))
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
    documents,
    documentPublicationEvents: {},
    resourceProgress: {},
    userChurchMemberships: memberships,
    __reset() {
      store.documents.length = 0
      store.memberships.length = 0
    },
    __seedDocument(row: Record<string, any>) {
      store.documents.push({
        id: `resource-${store.documents.length + 1}`,
        churchId: 'church-a',
        title: 'Resource',
        description: null,
        originalFileName: 'resource.pdf',
        contentType: 'application/pdf',
        sizeBytes: 100,
        resourceType: 'document',
        scope: 'branch',
        publicationStatus: 'published',
        visibleToMembers: true,
        networkId: null,
        categories: [],
        language: null,
        authorSpeaker: null,
        durationSeconds: null,
        pageCount: null,
        publishedAt: new Date(),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
        storageKey: 'documents/resource',
        ...row,
      })
    },
    __seedMembership(row: Record<string, any>) {
      store.memberships.push({
        userId: 'user-a',
        churchId: 'church-a',
        status: 'active',
        deletedAt: null,
        church: { networkId: null },
        ...row,
      })
    },
  }
})

import { FileUploadService } from './file-upload.service'
import { LibraryController } from '../library/library.controller'
import { REQUIRED_PERMISSION_KEY } from '../auth/guards/permission.guard'

const churchDb = require('@church/db') as {
  __reset: () => void
  __seedDocument: (row: Record<string, any>) => void
  __seedMembership: (row: Record<string, any>) => void
}

describe('FileUploadService library access', () => {
  let service: FileUploadService

  beforeEach(() => {
    churchDb.__reset()
    service = new FileUploadService()
    churchDb.__seedMembership({ userId: 'user-a', churchId: 'church-a', church: { networkId: 'network-1' } })
  })

  it('returns network resources to authorized branches but never branch resources from another church', async () => {
    churchDb.__seedDocument({ id: 'network-resource', scope: 'network', networkId: 'network-1' })
    churchDb.__seedDocument({ id: 'branch-a-resource', churchId: 'church-a' })
    churchDb.__seedDocument({ id: 'branch-b-resource', churchId: 'church-b' })

    const result = await service.listLibraryResources('user-a', 'church-a', 'member')

    expect(result.items.map((item) => item.id)).toEqual(['network-resource', 'branch-a-resource'])
    await expect(
      service.getLibraryResource('user-a', 'church-a', 'member', 'branch-b-resource'),
    ).rejects.toThrow(NotFoundException)
  })

  it('does not expose drafts or review items to members', async () => {
    churchDb.__seedDocument({ id: 'published', publicationStatus: 'published' })
    churchDb.__seedDocument({ id: 'draft', publicationStatus: 'draft', visibleToMembers: false })
    churchDb.__seedDocument({ id: 'review', publicationStatus: 'review', visibleToMembers: false })

    const result = await service.listLibraryResources('user-a', 'church-a', 'member')

    expect(result.items.map((item) => item.id)).toEqual(['published'])
  })

  it('keeps publication mutations behind the staff file permission', () => {
    expect(Reflect.getMetadata(REQUIRED_PERMISSION_KEY, LibraryController.prototype.transition)).toEqual([
      'manage:files',
    ])
    expect(Reflect.getMetadata(REQUIRED_PERMISSION_KEY, LibraryController.prototype.list)).toEqual([
      'read:self',
    ])
  })
})
