import { Injectable, OnModuleInit } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { announcementAttachments } from '@church/db';
import { DatabaseService } from '../database/database.service';
import { Database } from '../database/interfaces/database.interfaces';
import type {
  AnnouncementAttachmentRepository,
  NewAttachmentRecord,
} from './announcement-attachments.types';

@Injectable()
export class DrizzleAnnouncementAttachmentRepository
  implements AnnouncementAttachmentRepository, OnModuleInit
{
  private db: Database;

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    this.db = await this.databaseService.getDatabase();
  }

  async insert(record: NewAttachmentRecord): Promise<string> {
    const [row] = await this.db
      .insert(announcementAttachments)
      .values(record)
      .returning({ id: announcementAttachments.id });
    return row.id;
  }

  async findStorageRef(churchId: string, attachmentId: string): Promise<{ storageKey: string } | null> {
    const [row] = await this.db
      .select({ storageKey: announcementAttachments.storageKey })
      .from(announcementAttachments)
      .where(
        and(
          eq(announcementAttachments.id, attachmentId),
          eq(announcementAttachments.churchId, churchId),
        ),
      )
      .limit(1);
    return row ?? null;
  }
}
