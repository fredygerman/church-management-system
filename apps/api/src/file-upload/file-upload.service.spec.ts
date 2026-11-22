import { NotFoundException } from '@nestjs/common';

jest.mock('drizzle-orm', () => ({
  and: (...predicates: Array<((row: any) => boolean) | undefined>) =>
    (row: any) => predicates.filter(Boolean).every((predicate) => predicate!(row)),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  isNull: (column: string) => (row: any) => row[column] == null,
}));

jest.mock('@church/db', () => {
  const store: { documents: any[] } = { documents: [] };

  const documents = {
    __table: 'documents',
    id: 'id',
    churchId: 'churchId',
    uploadedBy: 'uploadedBy',
    originalFileName: 'originalFileName',
    contentType: 'contentType',
    sizeBytes: 'sizeBytes',
    storageKey: 'storageKey',
    title: 'title',
    description: 'description',
    visibleToMembers: 'visibleToMembers',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
  };

  const rowsFor = (table: any) => store[table.__table as keyof typeof store];
  const copy = (row: any) => ({ ...row });
  const project = (row: any, selection?: Record<string, string>) =>
    selection
      ? Object.fromEntries(
          Object.entries(selection).map(([key, column]) => [key, row[column]]),
        )
      : copy(row);

  const db = {
    query: {
      documents: {
        async findMany(options: { where?: (row: any) => boolean }) {
          const rows = options?.where
            ? rowsFor(documents).filter(options.where)
            : rowsFor(documents);
          return rows.map(copy);
        },
      },
    },
    update(table: any) {
      return {
        set(patch: Record<string, any>) {
          return {
            where(predicate: (row: any) => boolean) {
              const matched = rowsFor(table).filter(predicate);
              matched.forEach((row) => Object.assign(row, patch));
              return {
                async returning(selection?: Record<string, string>) {
                  return matched.map((row) => project(row, selection));
                },
              };
            },
          };
        },
      };
    },
  };

  return {
    db,
    documents,
    __reset() {
      store.documents.length = 0;
    },
    __seedDocument(row: Record<string, any>) {
      const document = {
        id: row.id ?? `document-${store.documents.length + 1}`,
        churchId: 'church-a',
        uploadedBy: 'owner-1',
        originalFileName: 'handbook.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        storageKey: 'documents/private-key',
        title: 'Handbook',
        description: 'Original description',
        visibleToMembers: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
        ...row,
      };
      store.documents.push(document);
      return document;
    },
  };
});
import { FileUploadService } from './file-upload.service';

const churchDb = require('@church/db') as {
  __reset: () => void;
  __seedDocument: (row: Record<string, any>) => any;
};

const CHURCH_A = 'church-a';
const CHURCH_B = 'church-b';

describe('FileUploadService document metadata', () => {
  let service: FileUploadService;

  beforeEach(() => {
    churchDb.__reset();
    service = new FileUploadService();
  });

  it('scopes staff listings to the caller church', async () => {
    churchDb.__seedDocument({ id: 'church-a-document', churchId: CHURCH_A });
    churchDb.__seedDocument({ id: 'church-b-document', churchId: CHURCH_B });

    const documents = await service.getUserDocuments(CHURCH_A, 'staff-1', 'admin');

    expect(documents.map((document) => document.id)).toEqual(['church-a-document']);
    expect(documents[0]).not.toHaveProperty('storageKey');
  });

  it('excludes soft-deleted rows and hides member-invisible rows from members', async () => {
    churchDb.__seedDocument({ id: 'visible', visibleToMembers: true });
    churchDb.__seedDocument({ id: 'hidden', visibleToMembers: false });
    churchDb.__seedDocument({
      id: 'deleted',
      visibleToMembers: true,
      deletedAt: new Date(),
    });

    const documents = await service.getUserDocuments(CHURCH_A, 'member-1', 'member');

    expect(documents.map((document) => document.id)).toEqual(['visible']);
  });

  it('updates only title and description', async () => {
    const original = churchDb.__seedDocument({
      id: 'document-1',
      uploadedBy: 'owner-1',
    });

    const updated = await service.updateDocument(
      CHURCH_A,
      original.id,
      'owner-1',
      'member',
      { title: 'Updated handbook', description: 'Updated description' },
    );

    expect(updated).toMatchObject({
      id: original.id,
      title: 'Updated handbook',
      description: 'Updated description',
      churchId: CHURCH_A,
      uploadedBy: 'owner-1',
    });
    expect(updated).not.toHaveProperty('storageKey');
    expect(updated.originalFileName).toBe(original.originalFileName);
    expect(updated.contentType).toBe(original.contentType);
    expect(updated.sizeBytes).toBe(original.sizeBytes);
    expect(updated.visibleToMembers).toBe(original.visibleToMembers);
  });

  it('rejects a non-owner update and a cross-church delete', async () => {
    churchDb.__seedDocument({ id: 'owned-by-another', uploadedBy: 'owner-1' });
    churchDb.__seedDocument({
      id: 'church-b-document',
      churchId: CHURCH_B,
      uploadedBy: 'owner-2',
    });

    await expect(
      service.updateDocument(CHURCH_A, 'owned-by-another', 'member-2', 'member', {
        title: 'Not allowed',
      }),
    ).rejects.toThrow(NotFoundException);

    await expect(
      service.markDocumentAsDeleted(
        CHURCH_A,
        'church-b-document',
        'owner-2',
        'admin',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
